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
    
    // Speed optimization: Sirf zaroori model load karein
    form.append('model_name', opts.model_name || 'isnet-general-use'); 
    let endpoint = "/process"; 

    // 1. Main Car Image handling
    const carImageData = Platform.OS === 'web' 
        ? await (await fetch(imageUri)).blob() 
        : { uri: imageUri, name: fileName || 'car_photo.jpg', type: 'image/jpeg' } as any;
    
    form.append('image', carImageData);

    // 2. Logic for Background Replacement & Transparency
    if (opts.bgUrl) {
        form.append('action', 'replace');
        if (opts.bgUrl.startsWith('http')) {
            // Pre-defined (URL based)
            form.append('bg_url', opts.bgUrl);
            endpoint = "/process";
        } else {
            // Custom Background (Local Upload)
            const bgData = Platform.OS === 'web'
                ? await (await fetch(opts.bgUrl)).blob()
                : { uri: opts.bgUrl, name: 'custom_bg.jpg', type: 'image/jpeg' } as any;
            
            form.append('background', bgData);
            form.append('car_size', '0.70'); 
            form.append('smart_placement', 'true');
            endpoint = "/replace-background"; 
        }
    } else if (opts.bg_color) {
        form.append('action', 'replace');
        form.append('bg_color', opts.bg_color);
        endpoint = "/process";
    } else {
        // ✅ FIXED FOR TRANSPARENCY: 
        // Jab sirf remove karna ho, toh 'format' PNG rakhein taake background black ki jagah transparent ho.
        form.append('action', 'remove');
        form.append('format', 'png'); 
        endpoint = "/process";
    }

    return { form, endpoint };
}

/**
 * Main AI function
 */
export async function processSingleImage(imageUri: string, fileName: string, opts: ProcessOptions = {}): Promise<string> {
    const { form, endpoint } = await buildFormData(imageUri, fileName, opts);

    // Timeout ko thoda optimize kiya hai fast response ke liye
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); 

    try {
        console.log(`Sending request to: ${API_BASE}${endpoint}`);
        
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: form,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorText = await res.text();
            console.error("[Backend Error]:", errorText);
            throw new Error(`API Error: ${errorText}`);
        }

        const blob = await res.blob();
        if (blob.size === 0) throw new Error("Empty response from AI server.");

        if (Platform.OS === 'web') {
            return URL.createObjectURL(blob);
        } else {
            const timestamp = Date.now();
            const localPath = `${FileSystem.cacheDirectory}processed_${timestamp}.png`;
            const reader = new FileReader();
            
            return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                    const base64 = (reader.result as string).split(',')[1];
                    await FileSystem.writeAsStringAsync(localPath, base64, { 
                        encoding: FileSystem.EncodingType.Base64 
                    });
                    resolve(localPath);
                };
                reader.onerror = () => reject(new Error("File conversion failed."));
                reader.readAsDataURL(blob);
            });
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error("Processing timed out for better speed control.");
        }
        throw error;
    }
}

export default processSingleImage;
