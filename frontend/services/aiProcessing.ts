import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE = "https://khan19970-carvite.hf.space";


export interface ProcessOptions {
    bgUrl?: string;
    bg_color?: string;
}

async function buildFormData(imageUri: string, fileName: string, opts: ProcessOptions): Promise<FormData> {
    const form = new FormData();

    if (Platform.OS === 'web') {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        form.append('image', blob, fileName || 'input.jpg');
    } else {
        // @ts-ignore
        form.append('image', {
            uri: imageUri,
            name: fileName || 'car_photo.jpg',
            type: 'image/jpeg',
        });
    }

    if (opts.bgUrl) form.append('bg_url', opts.bgUrl);
    if (opts.bg_color) form.append('bg_color', opts.bg_color);

    return form;
}

export async function processSingleImage(
    imageUri: string,
    fileName: string,
    opts: ProcessOptions = {}
): Promise<string> {
    const form = await buildFormData(imageUri, fileName, opts);

    try {
        const res = await fetch(`${API_BASE}`, {
            method: 'POST',
            body: form,
            signal: AbortSignal.timeout(90000)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`AI Backend error: ${res.status}`);
        }

        const blob = await res.blob();
        if (blob.size === 0) throw new Error("Empty response");

        if (Platform.OS === 'web') {
            return URL.createObjectURL(blob);
        } else {
            const timestamp = Date.now();
            const localPath = `${FileSystem.cacheDirectory}processed_${timestamp}.png`;
            const base64 = await blobToBase64(blob);
            await FileSystem.writeAsStringAsync(localPath, base64, {
                encoding: FileSystem.EncodingType.Base64
            });
            return localPath;
        }
    } catch (error: any) {
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
