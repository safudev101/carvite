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
            type: 'image/jpeg', 
        } as any);
    }

    if (opts.bgId) form.append('bg_id', opts.bgId);
    if (opts.bgUrl) form.append('bg_url', opts.bgUrl);
    if (opts.bgColor) form.append('bg_color', opts.bgColor);
    form.append('output_format', opts.outputFormat ?? 'WEBP');
    form.append('quality', String(opts.quality ?? 88));
    form.append('add_shadow', String(opts.addShadow ?? true));
    form.append('car_scale', String(opts.carScale ?? 0.82));

    return form;
}

export async function processSingleImage(
    imageUri: string,
    fileName: string,
    opts: ProcessOptions = {}
): Promise<string> {
    console.log("[AI] Processing image:", fileName);
    
    if (!API_BASE) {
        console.error("[AI] API URL is missing! Check .env file.");
        throw new Error("AI API URL missing.");
    }

    const form = await buildFormData(imageUri, fileName, opts);
    
    try {
        const res = await fetch(`${API_BASE}/process`, {
            method: 'POST',
            body: form,
            // Timeout add karne se loop break nahi hoga agar HF slow ho
            signal: AbortSignal.timeout(60000) // 60 seconds
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[AI] Backend Error (${res.status}):`, errorText);
            throw new Error(`AI Backend returned ${res.status}: ${errorText}`);
        }

        // Response check: Hamein file milni chahiye
        const blob = await res.blob();
        if (blob.size === 0) throw new Error("AI Backend returned an empty file.");

        console.log(`[AI] Success! Received processed image (${blob.size} bytes)`);

        if (Platform.OS === 'web') {
            return URL.createObjectURL(blob);
        } else {
            // Mobile storage logic
            const timestamp = Date.now();
            const localPath = `${FileSystem.cacheDirectory}processed_${timestamp}.webp`;
            const base64 = await blobToBase64(blob); // Helper below
            await FileSystem.writeAsStringAsync(localPath, base64, { encoding: FileSystem.EncodingType.Base64 });
            return localPath;
        }
    } catch (error: any) {
        if (error.name === 'TimeoutError') {
            console.error("[AI] API Timeout - Hugging Face might be waking up.");
        }
        console.error("[AI] Critical Error:", error.message);
        throw error; // Store will catch this and mark FAILED
    }
}

// Helper to handle base64 on mobile
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(',')[1]); // Remove data:image/*;base64,
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
