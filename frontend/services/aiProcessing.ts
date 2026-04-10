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
    
    // Default values
    form.append('model_name', opts.model_name || 'isnet-general-use'); 
    let endpoint = "/process"; 

    // 1. Main Car Image
    const carImageData = Platform.OS === 'web' 
        ? await (await fetch(imageUri)).blob() 
        : { uri: imageUri, name: fileName || 'car_photo.jpg', type: 'image/jpeg' } as any;
    
    form.append('image', carImageData);

    // 2. Logic for Background Replacement
    if (opts.bgUrl) {
        if (opts.bgUrl.startsWith('http')) {
            // ✅ Case: Pre-defined (URL based) - Uses /process
            form.append('action', 'replace');
            form.append('bg_url', opts.bgUrl);
            endpoint = "/process";
        } else {
            // ✅ Case: Custom Background (Local Upload) - Uses /replace-background
            // Backend expects 'background' field and specific endpoint
            const bgData = Platform.OS === 'web'
                ? await (await fetch(opts.bgUrl)).blob()
                : { uri: opts.bgUrl, name: 'custom_bg.jpg', type: 'image/jpeg' } as any;
            
            form.append('background', bgData);
            form.append('car_size', '0.70'); 
            form.append('smart_placement', 'true');
            
            // Switch to the dedicated replacement endpoint
            endpoint = "/replace-background"; 
        }
    } else if (opts.bg_color) {
        form.append('action', 'replace');
        form.append('bg_color', opts.bg_color);
        endpoint = "/process";
    } else {
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
    const timeoutId = setTimeout(() => controller.abort(), 120000); 

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
        console.error("Processing Error:", error.message);
        throw error;
    }
}

export default processSingleImage;
