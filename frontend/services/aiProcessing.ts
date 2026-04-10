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
    
    // Default model_name jo main.py mang raha hai
    form.append('model_name', opts.model_name || 'isnet-general-use'); 
    let endpoint = "/process"; 

    // 1. Car Image Handle
    const carImageData = Platform.OS === 'web' 
        ? await (await fetch(imageUri)).blob() 
        : { uri: imageUri, name: fileName || 'car_photo.jpg', type: 'image/jpeg' } as any;
    
    form.append('image', carImageData);

    // 2. Logic based on main.py conditions
    if (opts.bgUrl) {
        if (opts.bgUrl.startsWith('http')) {
            // Case: Pre-defined URL Replacement
            form.append('action', 'replace');
            form.append('bg_url', opts.bgUrl);
            endpoint = "/process";
        } else {
            // Case: Custom Local BG Upload (Uses dedicated endpoint)
            const bgData = Platform.OS === 'web'
                ? await (await fetch(opts.bgUrl)).blob()
                : { uri: opts.bgUrl, name: 'custom_bg.jpg', type: 'image/jpeg' } as any;
            
            form.append('background', bgData);
            form.append('car_size', '0.70'); 
            form.append('smart_placement', 'true');
            endpoint = "/replace-background"; 
        }
    } else if (opts.bg_color && opts.bg_color !== 'transparent') {
        // Case: Color Background
        form.append('action', 'replace');
        form.append('bg_color', opts.bg_color);
        endpoint = "/process";
    } else {
        // ✅ FIXED FOR TRANSPARENCY:
        // main.py checks: if action == "remove" and not bg_url and not bg_color
        // Hum sirf action bhejenge, baqi parameters ko omit kar denge.
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

    // Speed optimization: Timeout set to 90s for faster failure detection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); 

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: form,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Backend Error: ${errorText}`);
        }

        const blob = await res.blob();
        if (blob.size === 0) throw new Error("Empty image received.");

        // Force blob type as PNG for transparency handling on Web/Mobile
        const pngBlob = new Blob([blob], { type: 'image/png' });

        if (Platform.OS === 'web') {
            return URL.createObjectURL(pngBlob);
        } else {
            const timestamp = Date.now();
            const localPath = `${FileSystem.cacheDirectory}processed_${timestamp}.png`;
            const reader = new FileReader();
            
            return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                    const result = reader.result as string;
                    const base64 = result.split(',')[1];
                    await FileSystem.writeAsStringAsync(localPath, base64, { 
                        encoding: FileSystem.EncodingType.Base64 
                    });
                    resolve(localPath);
                };
                reader.onerror = () => reject(new Error("File conversion failed."));
                reader.readAsDataURL(pngBlob);
            });
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error("AI processing failed:", error.message);
        throw error;
    }
}

export default processSingleImage;
