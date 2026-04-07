/**
 * AutoVisio — AI Processing Service
 * Connects to the FastAPI backend on Hugging Face Spaces
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_AI_API_URL ?? '';

if (!API_BASE) {
    console.warn('[aiProcessing] EXPO_PUBLIC_AI_API_URL is not set');
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProcessOptions {
    bgId?: string;        // Built-in background ID
    bgUrl?: string;       // Custom background URL
    bgColor?: string;     // Hex color e.g. "#1a1a1a"
    outputFormat?: 'WEBP' | 'JPEG' | 'PNG';
    quality?: number;     // 60-100
    addShadow?: boolean;
    addReflection?: boolean;
    carScale?: number;    // 0.5 - 0.95
}

export interface BatchResult {
    index: number;
    filename: string;
    success: boolean;
    data?: string;        // base64 encoded image
    mimeType?: string;
    sizeKb?: number;
    error?: string;
}

export interface BatchResponse {
    total: number;
    success: number;
    failed: number;
    results: BatchResult[];
}

export interface HealthResponse {
    status: 'ok' | 'error';
    model_loaded: boolean;
    version: string;
    timestamp: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function buildFormData(
    imageUri: string,
    fileName: string,
    opts: ProcessOptions
): Promise<FormData> {
    const form = new FormData();

    if (Platform.OS === 'web') {
        // Web: fetch the blob from the object URL
        const res = await fetch(imageUri);
        const blob = await res.blob();
        form.append('image', blob, fileName);
    } else {
        // Native: use the file URI directly
        form.append('image', {
            uri: imageUri,
            name: fileName,
            type: guessMediaType(fileName),
        } as any);
    }

    if (opts.bgId) form.append('bg_id', opts.bgId);
    if (opts.bgUrl) form.append('bg_url', opts.bgUrl);
    if (opts.bgColor) form.append('bg_color', opts.bgColor);
    form.append('output_format', opts.outputFormat ?? 'WEBP');
    form.append('quality', String(opts.quality ?? 88));
    form.append('add_shadow', String(opts.addShadow ?? true));
    form.append('add_reflection', String(opts.addReflection ?? true));
    form.append('car_scale', String(opts.carScale ?? 0.82));

    return form;
}

function guessMediaType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg',
        png: 'image/png', webp: 'image/webp',
        heic: 'image/heic', heif: 'image/heif',
    };
    return map[ext ?? ''] ?? 'image/jpeg';
}

function base64ToUri(base64: string, mimeType: string): string {
    return `data:${mimeType};base64,${base64}`;
}

async function saveBase64ToCache(
    base64: string,
    mimeType: string,
    id: string
): Promise<string> {
    if (Platform.OS === 'web') {
        return base64ToUri(base64, mimeType);
    }
    const ext = mimeType.split('/')[1] ?? 'webp';
    const path = `${(FileSystem as any).cacheDirectory}carvite_${id}.${ext}`;
    await (FileSystem as any).writeAsStringAsync(path, base64, {
        encoding: 'base64' as any,
    });
    return path;
}

// ── API Calls ──────────────────────────────────────────────────────────────

/**
 * Health check — confirm backend is running and model is loaded
 */
export async function checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
}

/**
 * List built-in backgrounds from the backend
 */
export async function fetchBackgrounds(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/backgrounds`);
    if (!res.ok) throw new Error('Failed to fetch backgrounds');
    const json = await res.json();
    return json.backgrounds ?? [];
}

/**
 * Process a single image.
 * Returns the processed image as a local URI (native) or data URI (web).
 */
export async function processSingleImage(
    imageUri: string,
    fileName: string,
    opts: ProcessOptions = {},
    onProgress?: (pct: number) => void
): Promise<string> {
    onProgress?.(5);
    const form = await buildFormData(imageUri, fileName, opts);
    onProgress?.(15);

    const res = await fetch(`${API_BASE}/process`, {
        method: 'POST',
        body: form,
        // No Content-Type header — let fetch set multipart boundary
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`API error ${res.status}: ${errText}`);
    }

    onProgress?.(80);

    if (Platform.OS === 'web') {
        const blob = await res.blob();
        onProgress?.(100);
        return URL.createObjectURL(blob);
    } else {
        // Native: read as base64
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = res.headers.get('Content-Type') ?? 'image/webp';
        const ext = mimeType.split('/')[1] ?? 'webp';
        const path = `${(FileSystem as any).cacheDirectory}carvite_result_${Date.now()}.${ext}`;
        await (FileSystem as any).writeAsStringAsync(path, base64, {
            encoding: 'base64' as any,
        });
        onProgress?.(100);
        return path;
    }
}

/**
 * Batch process multiple images.
 * Calls the /process/batch endpoint and returns results with local URIs.
 */
export async function processBatch(
    images: Array<{ uri: string; id: string; fileName: string }>,
    opts: ProcessOptions = {},
    onItemComplete?: (id: string, resultUri: string | null, error?: string) => void
): Promise<void> {
    const form = new FormData();

    for (const img of images) {
        if (Platform.OS === 'web') {
            const res = await fetch(img.uri);
            const blob = await res.blob();
            form.append('images', blob, img.fileName);
        } else {
            form.append('images', {
                uri: img.uri,
                name: img.fileName,
                type: guessMediaType(img.fileName),
            } as any);
        }
    }

    if (opts.bgId) form.append('bg_id', opts.bgId);
    if (opts.bgUrl) form.append('bg_url', opts.bgUrl);
    if (opts.bgColor) form.append('bg_color', opts.bgColor);
    form.append('output_format', opts.outputFormat ?? 'WEBP');
    form.append('quality', String(opts.quality ?? 88));
    form.append('add_shadow', String(opts.addShadow ?? true));
    form.append('add_reflection', String(opts.addReflection ?? true));

    const res = await fetch(`${API_BASE}/process/batch`, {
        method: 'POST',
        body: form,
    });

    if (!res.ok) throw new Error(`Batch API error: ${res.status}`);

    const json: BatchResponse = await res.json();

    for (const result of json.results) {
        const img = images[result.index];
        if (!img) continue;

        if (result.success && result.data) {
            const localUri = await saveBase64ToCache(
                result.data,
                result.mimeType ?? 'image/webp',
                img.id
            );
            onItemComplete?.(img.id, localUri);
        } else {
            onItemComplete?.(img.id, null, result.error);
        }
    }
}// import { ProcessingRequest, ProcessingResult } from "@/types";

// // ─── Config ───────────────────────────────────────────────────────────────────
// // Set in .env:  EXPO_PUBLIC_AI_API_URL=https://your-space.hf.space

// const AI_API_BASE = process.env.EXPO_PUBLIC_AI_API_URL ?? "";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface ProcessImagePayload {
//     imageUri: string;          // local file URI or remote URL
//     backgroundUrl?: string;    // URL of background to composite
//     outputFormat?: "webp" | "jpeg" | "png";
//     quality?: number;          // 1–100
// }

// // ─── Core Processing ──────────────────────────────────────────────────────────

// /**
//  * Send a car image to the FastAPI/rembg backend for background removal and
//  * optional background compositing. Returns the processed image as a base64
//  * data URI.
//  */
// export async function processCarImage(
//     payload: ProcessImagePayload
// ): Promise<ProcessingResult> {
//     if (!AI_API_BASE) {
//         return { success: false, error: "AI API URL is not configured." };
//     }

//     try {
//         // 1. Fetch the image file as a blob
//         const imageResponse = await fetch(payload.imageUri);
//         if (!imageResponse.ok) {
//             throw new Error(`Could not fetch source image: ${imageResponse.statusText}`);
//         }
//         const imageBlob = await imageResponse.blob();

//         // 2. Build multipart form data
//         const formData = new FormData();
//         formData.append("file", imageBlob, "car_image.jpg");

//         if (payload.backgroundUrl) {
//             formData.append("background_url", payload.backgroundUrl);
//         }

//         formData.append("output_format", payload.outputFormat ?? "webp");
//         formData.append("quality", String(payload.quality ?? 90));

//         // 3. POST to FastAPI endpoint
//         const apiResponse = await fetch(`${AI_API_BASE}/process`, {
//             method: "POST",
//             body: formData,
//             // Note: Do NOT set Content-Type manually; browser sets it with boundary
//         });

//         if (!apiResponse.ok) {
//             const errText = await apiResponse.text();
//             throw new Error(`API error ${apiResponse.status}: ${errText}`);
//         }

//         // 4. Backend returns processed image as binary
//         const processedBlob = await apiResponse.blob();
//         const processedUri = await blobToDataUri(processedBlob);

//         return { success: true, processedUri };
//     } catch (err: any) {
//         console.error("[aiProcessing] Error:", err);
//         return { success: false, error: err.message ?? "Unknown error" };
//     }
// }

// /**
//  * Batch process multiple images. Returns results in the same order as input.
//  */
// export async function processBatch(
//     images: ProcessImagePayload[],
//     onProgress?: (completed: number, total: number) => void
// ): Promise<ProcessingResult[]> {
//     const results: ProcessingResult[] = [];

//     for (let i = 0; i < images.length; i++) {
//         const result = await processCarImage(images[i]);
//         results.push(result);
//         onProgress?.(i + 1, images.length);
//     }

//     return results;
// }

// /**
//  * Health check — ping the FastAPI backend.
//  */
// export async function checkApiHealth(): Promise<boolean> {
//     if (!AI_API_BASE) return false;
//     try {
//         const res = await fetch(`${AI_API_BASE}/health`, {
//             signal: AbortSignal.timeout(5000),
//         });
//         return res.ok;
//     } catch {
//         return false;
//     }
// }

// // ─── Utilities ────────────────────────────────────────────────────────────────

// function blobToDataUri(blob: Blob): Promise<string> {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result as string);
//         reader.onerror = reject;
//         reader.readAsDataURL(blob);
//     });
// }