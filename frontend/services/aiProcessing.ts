import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_AI_API_URL ?? '';

export interface ProcessOptions {
    bgId?: string;
    bgUrl?: string;
    bgColor?: string;
    outputFormat?: 'WEBP' | 'JPEG' | 'PNG';
    quality?: number;
    addShadow?: boolean;
    addReflection?: boolean;
    carScale?: number;
}

async function buildFormData(imageUri: string, fileName: string, opts: ProcessOptions): Promise<FormData> {
    const form = new FormData();

    if (Platform.OS === 'web') {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        form.append('image', blob, fileName);
    } else {
        form.append('image', {
            uri: imageUri,
            name: fileName,
            type: 'image/jpeg', // Standard type
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

export async function processSingleImage(
    imageUri: string,
    fileName: string,
    opts: ProcessOptions = {},
    onProgress?: (pct: number) => void
): Promise<string> {
    if (!API_BASE) throw new Error("AI API URL is not configured.");

    onProgress?.(10);
    const form = await buildFormData(imageUri, fileName, opts);
    
    try {
        const res = await fetch(`${API_BASE}/process`, {
            method: 'POST',
            body: form,
        });

        if (!res.ok) {
            const errorData = await res.text();
            throw new Error(`Backend Error: ${errorData}`);
        }

        onProgress?.(70);

        if (Platform.OS === 'web') {
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        } else {
            const timestamp = Date.now();
            const localPath = `${FileSystem.cacheDirectory}processed_${timestamp}.webp`;
            
            // Result ko seedha file mein save karna
            const downloadRes = await FileSystem.downloadAsync(res.url, localPath);
            onProgress?.(100);
            return downloadRes.uri;
        }
    } catch (error: any) {
        console.error("[aiProcessing] Error:", error);
        throw error;
    }
}
