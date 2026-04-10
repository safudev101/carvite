import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE = "https://khan19970-carvite.hf.space"/process;

export interface ProcessOptions {
    bgUrl?: string;
    bg_color?: string;
    model_name?: string; // Added for backend compatibility
}

/**
 * Helper: Build FormData correctly for the Backend
 */
async function buildFormData(imageUri: string, fileName: string, opts: ProcessOptions): Promise<{ form: FormData; endpoint: string }> {
    const form = new FormData();
    const action = (opts.bgUrl || opts.bg_color) ? 'replace' : 'remove';
    
    // Backend expects action and model_name
    form.append('action', action);
    form.append('model_name', opts.model_name || 'unimodel-car-v1'); // Default model name
    
    let endpoint = "/process"; 

    // Car Image handle
    const carImageData = Platform.OS === 'web' 
        ? await (await fetch(imageUri)).blob() 
        : { uri: imageUri, name: fileName || 'car_photo.jpg', type: 'image/jpeg' } as any;
    
    form.append('image', carImageData);

    // Background logic
    if (opts.bgUrl) {
        if (opts.bgUrl.startsWith('http')) {
            form.append('bg_url', opts.bgUrl);
            endpoint = "/process"; 
        } else {
            // Local Background logic
            const bgData = Platform.OS === 'web'
                ? await (await fetch(opts.bgUrl)).blob()
                : { uri: opts.bgUrl, name: 'background.jpg', type: 'image/jpeg' } as any;
            
            // form.append('background', bgData);
            // form.append('car_size', '0.65'); 
            // form.append('smart_placement', 'true');
            // // Agar backend specific endpoint use karta hai local files ke liye
            let endpoint = "/process";
        }
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
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: form,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorText = await res.text();
            // Logging specific backend error for debugging
            console.error("[Backend Raw Error]:", errorText);
            throw new Error(`Backend Error (${res.status}): ${errorText}`);
        }

        const blob = await res.blob();
        if (blob.size === 0) throw new Error("Backend ne khali image bheji hai.");

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
                reader.onerror = () => reject(new Error("Image blob read error."));
                reader.readAsDataURL(blob);
            });
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        throw error;
    }
}

export default processSingleImage;
