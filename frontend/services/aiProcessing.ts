import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE = "https://khan19970-carvite.hf.space";

export interface ProcessOptions {
    bgUrl?: string;
    bg_color?: string;
}

/**
 * Helper: Build FormData and determine correct endpoint
 */
async function buildFormData(imageUri: string, fileName: string, opts: ProcessOptions): Promise<{ form: FormData; endpoint: string }> {
    const form = new FormData();
    
    // Action decide karein: Agar background hai toh replace, warna remove
    const action = (opts.bgUrl || opts.bg_color) ? 'replace' : 'remove';
    form.append('action', action);
    
    let endpoint = "/process"; 

    // Main Car Image Handle
    const carImageData = Platform.OS === 'web' 
        ? await (await fetch(imageUri)).blob() 
        : { uri: imageUri, name: fileName || 'car_photo.jpg', type: 'image/jpeg' } as any;
    
    form.append('image', carImageData);

    // Background Logic
    if (opts.bgUrl) {
        if (opts.bgUrl.startsWith('http')) {
            form.append('bg_url', opts.bgUrl);
            endpoint = "/process"; 
        } else {
            // Custom Local Background Upload
            const bgData = Platform.OS === 'web'
                ? await (await fetch(opts.bgUrl)).blob()
                : { uri: opts.bgUrl, name: 'background.jpg', type: 'image/jpeg' } as any;
            
            form.append('background', bgData);
            form.append('car_size', '0.65'); 
            form.append('smart_placement', 'true');
            endpoint = "/replace-background"; 
        }
    } else if (opts.bg_color) {
        form.append('bg_color', opts.bg_color);
        endpoint = "/process";
    }

    return { form, endpoint };
}

/**
 * Main Process Function
 */
export async function processSingleImage(
    imageUri: string,
    fileName: string,
    opts: ProcessOptions = {}
): Promise<string> {
    const { form, endpoint } = await buildFormData(imageUri, fileName, opts);

    // FIX: Manual timeout to prevent "S is not a function"
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: form,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Backend Error (${res.status}): ${errorText}`);
        }

        const blob = await res.blob();
        if (blob.size === 0) throw new Error("Backend returned empty image");

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
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error("[AI] Timeout: Request took too long.");
        } else {
            console.error("[AI] Critical Error:", error.message);
        }
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
