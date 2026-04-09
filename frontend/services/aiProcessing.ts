import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// DIRECT URL: Ab .env ki tension khatam
const API_BASE = "https://khan19970-carvite.hf.space";

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
        // Mobile fixed format
        form.append('image', {
            uri: imageUri,
            name: fileName || 'car_photo.jpg',
            type: 'image/jpeg', 
        } as any);
    }

    // Backend params (jo humne Python mein likhe hain)
    if (opts.bgUrl) form.append('bg_url', opts.bgUrl);
    if (opts.bgColor) form.append('bg_color', opts.bgColor);
    
    // Default values set to match our professional logic
    form.append('car_scale', String(opts.carScale ?? 0.88)); 

    return form;
}

export async function processSingleImage(
    imageUri: string,
    fileName: string,
    opts: ProcessOptions = {}
): Promise<string> {
    console.log("[AI] Connecting to Hugging Face:", API_BASE);
    
    const form = await buildFormData(imageUri, fileName, opts);
    
    try {
        const res = await fetch(`${API_BASE}/process`, {
            method: 'POST',
            body: form,
            // 60 seconds wait taake model "awake" ho jaye
            signal: AbortSignal.timeout(60000) 
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[AI] Backend Error (${res.status}):`, errorText);
            throw new Error(`AI Backend returned ${res.status}`);
        }

        const blob = await res.blob();
        if (blob.size === 0) throw new Error("Empty response from AI");

        console.log(`[AI] Success! Received Image: ${blob.size} bytes`);

        if (Platform.OS === 'web') {
            return URL.createObjectURL(blob);
        } else {
            const timestamp = Date.now();
            // Using PNG as base since our model returns PNG for best quality
            const localPath = `${FileSystem.cacheDirectory}processed_${timestamp}.png`;
            const base64 = await blobToBase64(blob);
            await FileSystem.writeAsStringAsync(localPath, base64, { 
                encoding: FileSystem.EncodingType.Base64 
            });
            return localPath;
        }
    } catch (error: any) {
        if (error.name === 'TimeoutError') {
            console.error("[AI] Hugging Face is taking too long to wake up.");
        }
        console.error("[AI] Error:", error.message);
        throw error;
    }
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(',')[1]); 
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
