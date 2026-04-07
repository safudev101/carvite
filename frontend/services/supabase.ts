/**
 * AutoVisio — Supabase Service
 * Typed client + Storage + Database helpers
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// ── Client ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error('[supabase] Missing env vars: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    },
});

// ── Bucket names ───────────────────────────────────────────────────────────

export const BUCKETS = {
    RAW: 'raw_images',
    PROCESSED: 'processed_images',
} as const;

// ── Database types ─────────────────────────────────────────────────────────

export interface DbProfile {
    id: string;
    full_name: string | null;
    email: string;
    plan: 'free' | 'pro' | 'enterprise';
    credits_remaining: number;
    total_images_processed: number;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
}

export interface DbCarImage {
    id: string;
    user_id: string;
    original_url: string | null;
    processed_url: string | null;
    file_name: string | null;
    file_size: number | null;
    background_id: string | null;
    status: 'pending' | 'processing' | 'completed' | 'error';
    error_message: string | null;
    processing_time_ms: number | null;
    created_at: string;
    updated_at: string;
}

// ── Storage helpers ────────────────────────────────────────────────────────

/**
 * Upload a raw image file to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadRawImage(
    fileUri: string,
    userId: string,
    fileName: string
): Promise<string> {
    const path = `${userId}/${Date.now()}_${fileName}`;

    let fileData: Blob | ArrayBuffer;

    if (Platform.OS === 'web') {
        const res = await fetch(fileUri);
        fileData = await res.blob();
    } else {
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: (FileSystem as any).EncodingType.Base64,
        });
        // Convert base64 → Uint8Array
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        fileData = bytes.buffer;
    }

    const { data, error } = await supabase.storage
        .from(BUCKETS.RAW)
        .upload(path, fileData, {
            contentType: guessMime(fileName),
            upsert: false,
        });

    if (error) throw new Error(`Raw upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
        .from(BUCKETS.RAW)
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}

/**
 * Upload a processed image (local URI) to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadProcessedImage(
    fileUri: string,
    userId: string,
    imageId: string
): Promise<string> {
    const path = `${userId}/${imageId}.webp`;

    let fileData: Blob | ArrayBuffer;

    if (Platform.OS === 'web') {
        // fileUri may be a blob URL or data URI
        if (fileUri.startsWith('data:')) {
            const base64 = fileUri.split(',')[1];
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            fileData = bytes.buffer;
        } else {
            const res = await fetch(fileUri);
            fileData = await res.blob();
        }
    } else {
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: (FileSystem as any).EncodingType.Base64,
        });
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        fileData = bytes.buffer;
    }

    const { data, error } = await supabase.storage
        .from(BUCKETS.PROCESSED)
        .upload(path, fileData, {
            contentType: 'image/webp',
            upsert: true,
        });

    if (error) throw new Error(`Processed upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
        .from(BUCKETS.PROCESSED)
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}

/**
 * Delete files from storage by path array.
 */
export async function deleteStorageFiles(
    bucket: typeof BUCKETS[keyof typeof BUCKETS],
    paths: string[]
): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) console.error('[supabase] deleteStorageFiles error:', error);
}

// ── Database helpers ───────────────────────────────────────────────────────

/** Fetch the current user's profile */
export async function getProfile(userId: string): Promise<DbProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) { console.error('[supabase] getProfile:', error); return null; }
    return data;
}

/** Create a new car_images record (returns the id) */
export async function createImageRecord(params: {
    userId: string;
    originalUrl: string;
    fileName: string;
    fileSize?: number;
    backgroundId?: string;
}): Promise<string> {
    const { data, error } = await supabase
        .from('car_images')
        .insert({
            user_id: params.userId,
            original_url: params.originalUrl,
            file_name: params.fileName,
            file_size: params.fileSize ?? null,
            background_id: params.backgroundId ?? null,
            status: 'pending',
        })
        .select('id')
        .single();

    if (error) throw new Error(`createImageRecord: ${error.message}`);
    return data.id;
}

/** Mark a car_images record as completed with the processed URL */
export async function markImageCompleted(
    imageId: string,
    processedUrl: string,
    processingTimeMs: number
): Promise<void> {
    const { error } = await supabase
        .from('car_images')
        .update({
            processed_url: processedUrl,
            status: 'completed',
            processing_time_ms: processingTimeMs,
            updated_at: new Date().toISOString(),
        })
        .eq('id', imageId);

    if (error) throw new Error(`markImageCompleted: ${error.message}`);
}

/** Mark a car_images record as failed */
export async function markImageError(
    imageId: string,
    errorMessage: string
): Promise<void> {
    await supabase
        .from('car_images')
        .update({
            status: 'error',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
        })
        .eq('id', imageId);
}

/** Decrement user credits by amount (1 per image) */
export async function deductCredits(userId: string, amount = 1): Promise<void> {
    const { error } = await supabase.rpc('decrement_credits', {
        user_id: userId,
        amount,
    });
    if (error) console.error('[supabase] deductCredits:', error);
}

/** Increment total_images_processed on profile */
export async function incrementProcessedCount(userId: string, amount = 1): Promise<void> {
    const { error } = await supabase.rpc('increment_processed_count', {
        user_id: userId,
        amount,
    });
    if (error) console.error('[supabase] incrementProcessedCount:', error);
}

// ── Admin helpers ──────────────────────────────────────────────────────────

export interface AdminStats {
    total_users: number;
    total_images: number;
    images_today: number;
    pro_users: number;
    free_users: number;
}

export async function getAdminStats(): Promise<AdminStats> {
    const { data, error } = await supabase
        .from('admin_stats')
        .select('*')
        .single();
    if (error) throw new Error(`getAdminStats: ${error.message}`);
    return data;
}

export async function getAllUsers(page = 0, pageSize = 25): Promise<DbProfile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw new Error(`getAllUsers: ${error.message}`);
    return data ?? [];
}

export async function updateUserPlan(
    userId: string,
    plan: 'free' | 'pro' | 'enterprise',
    credits?: number
): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update({
            plan,
            ...(credits !== undefined ? { credits_remaining: credits } : {}),
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    if (error) throw new Error(`updateUserPlan: ${error.message}`);
}

// ── Utils ──────────────────────────────────────────────────────────────────

function guessMime(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg',
        png: 'image/png', webp: 'image/webp',
        heic: 'image/heic', heif: 'image/heif',
    };
    return map[ext ?? ''] ?? 'image/jpeg';
}