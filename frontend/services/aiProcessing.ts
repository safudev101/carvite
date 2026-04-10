import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_AI_API_URL || "https://khan19970-carvite.hf.space";

export interface ProcessOptions {
    bgUrl?: string;
    bg_color?: string;
    model_name?: string;
}

/**
 * Helper: Build FormData correctly for the Backend
 */
async function buildFormData(imageUri: string, fileName: string, opts: ProcessOptions): Promise<{ form: FormData; endpoint: string }> {
    const form = new FormData();
    
    // Model name according to main.py
    form.append('model_name', opts.model_name || 'isnet-general-use'); 
    let endpoint = "/process"; 

    // 1. Car Image Handling (Optimized for Mobile/Web)
    const carImageData = Platform.OS === 'web' 
        ? await (await fetch(imageUri)).blob() 
        : { 
            uri: imageUri, 
            name: fileName || 'car_photo.jpg', 
            type: 'image/jpeg' 
          } as any;
    
    form.append('image', carImageData);

    // 2. Conditional Logic for Backend Conditions
    if (opts.bgUrl) {
        if (opts.bgUrl.startsWith('http')) {
            form.append('action', 'replace');
            form.append('bg_url', opts.bgUrl);
            endpoint = "/process";
        } else {
            // Custom Local BG
            const bgData = Platform.OS === 'web'
                ? await (await fetch(opts.bgUrl)).blob()
                : { 
                    uri: opts.bgUrl, 
                    name: 'custom_bg.jpg', 
                    type: 'image/jpeg' 
                  } as any;
            
            form.append('background', bgData);
            form.append('car_size', '0.70'); 
            form.append('smart_placement', 'true');
            endpoint = "/replace-background"; 
        }
    } else if (opts.bg_color && opts.bg_color !== 'transparent' && opts.bg_color !== '') {
        form.append('action', 'replace');
        form.append('bg_color', opts.bg_color);
        endpoint = "/process";
    } else {
        // ✅ STRICT TRANSPARENCY:
        // Main.py condition: if action == "remove" and not bg_url and not bg_color
        // We ensure NO extra fields are sent.
        form.append('action', 'remove');
        endpoint = "/process";
    }

    return { form, endpoint };
}

/**
 * Main AI function
 */
export async function processSingleImage(imageUri: string, fileName: string, opts: ProcessOptions = {}): Promise<string> {
    const { form, endpoint } = await buildFormData(imageUri, fileName, opts);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); 

    try {
        console.log(`[AI Request]: Sending to ${endpoint}`);
        
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: form,
            headers: {
                // Ensure backend knows we expect an image
                'Accept': 'image/png',
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Backend Error: ${errorText}`);
        }

        const blob = await res.blob();
        if (blob.size === 0) throw new Error("Empty image received.");

        // ✅ IMPORTANT: Force PNG type for transparency rendering
        const pngBlob = new Blob([blob], { type: 'image/png' });

        if (Platform.OS === 'web') {
            return URL.createObjectURL(pngBlob);
        } else {
            const timestamp = Date.now();
            const localPath = `${FileSystem.cacheDirectory}processed_${timestamp}.png`;
            
            // Read as Data URL to maintain transparency during Base64 conversion
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                    const result = reader.result as string;
                    const base64 = result.split(',')[1];
                    try {
                        await FileSystem.writeAsStringAsync(localPath, base64, { 
                            encoding: FileSystem.EncodingType.Base64 
                        });
                        resolve(localPath);
                    } catch (e) {
                        reject(new Error("Storage failed"));
                    }
                };
                reader.onerror = () => reject(new Error("Blob read error"));
                reader.readAsDataURL(pngBlob);
            });
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error("AI Error:", error.message);
        throw error;
    }
}

export default processSingleImage;
