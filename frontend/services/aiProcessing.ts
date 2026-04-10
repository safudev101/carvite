import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE = "https://khan19970-carvite.hf.space";

export interface ProcessOptions {
    bgUrl?: string;
    bgId?: string;
    bg_color?: string;
    action: 'remove' | 'replace'; // ✅ Mandatory field for new logic
    outputFormat?: "PNG" | "WEBP" | "JPG";
}

async function buildFormData(imageUri: string, fileName: string, opts: ProcessOptions): Promise<{ form: FormData; endpoint: string }> {
    const form = new FormData();
    let endpoint = "/process"; // ✅ Standardized to /process

    // 1. Main Car Image
    const carImageData = Platform.OS === 'web' 
        ? await (await fetch(imageUri)).blob() 
        : { 
            uri: imageUri, 
            name: fileName || 'car_photo.jpg', 
            type: 'image/jpeg' 
          };
    
    form.append('image', carImageData as any);

    // 2. Action Logic (Backend expects 'remove' or 'replace')
    form.append('action', opts.action);

    // 3. Background Logic
    if (opts.action === 'replace') {
        if (opts.bgUrl) {
            const isRemote = opts.bgUrl.startsWith('http');
            if (isRemote) {
                form.append('bg_url', opts.bgUrl);
            } else {
                // Custom Local Upload Case
                const bgData = Platform.OS === 'web'
                    ? await (await fetch(opts.bgUrl)).blob()
                    : { uri: opts.bgUrl, name: 'background.jpg', type: 'image/jpeg' };
                
                form.append('background', bgData as any);
                form.append('car_size', '65'); 
                form.append('smart_placement', 'true');
                endpoint = "/replace-background"; // Switch to special endpoint for custom BG
            }
        } else if (opts.bg_color) {
            form.append('bg_color', opts.bg_color);
        }
    }

    // 4. Output Format
    if (opts.outputFormat) {
        form.append('output_format', opts.outputFormat);
    }

    return { form, endpoint };
}

export async function processSingleImage(
    imageUri: string,
    fileName: string,
    opts: ProcessOptions
): Promise<string> {
    const { form, endpoint } = await buildFormData(imageUri, fileName, opts);

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: form,
            signal: AbortSignal.timeout(120000) // 2 Minute Timeout
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Backend Error (${res.status}): ${errorText}`);
        }

        const blob = await res.blob();
        if (blob.size === 0) throw new Error("Empty response from AI");

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
        console.error("[AI] Critical Error:", error.message);
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


