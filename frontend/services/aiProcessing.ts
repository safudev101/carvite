import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE = "https://khan19970-carvite.hf.space";

export interface ProcessOptions {
    bgUrl?: string;
    bg_color?: string;
}

async function buildFormData(imageUri: string, fileName: string, opts: ProcessOptions): Promise<{ form: FormData; endpoint: string }> {
    const form = new FormData();
    
    // 1. Action Decide Karein: Agar background ka data hai toh 'replace', warna 'remove'
    const action = (opts.bgUrl || opts.bg_color) ? 'replace' : 'remove';
    form.append('action', action);
    
    // 2. Default Endpoint
    let endpoint = "/process"; 

    // 3. Main Car Image Handle Karein
    const carImageData = Platform.OS === 'web' 
        ? await (await fetch(imageUri)).blob() 
        : { uri: imageUri, name: fileName || 'car_photo.jpg', type: 'image/jpeg' } as any;
    
    form.append('image', carImageData);

    // 4. Background Logic
    if (opts.bgUrl) {
        if (opts.bgUrl.startsWith('http')) {
            // Predefined background URL
            form.append('bg_url', opts.bgUrl);
            endpoint = "/process"; 
        } else {
            // Custom Background Upload (Local Image)
            const bgData = Platform.OS === 'web'
                ? await (await fetch(opts.bgUrl)).blob()
                : { uri: opts.bgUrl, name: 'background.jpg', type: 'image/jpeg' } as any;
            
            form.append('background', bgData);
            form.append('car_size', '0.65'); 
            form.append('smart_placement', 'true');
            endpoint = "/replace-background"; // Alag endpoint for dual file upload
        }
    } else if (opts.bg_color) {
        // Solid Color Background
        form.append('bg_color', opts.bg_color);
        endpoint = "/process";
    }

    return { form, endpoint };
}
export async function processSingleImage(
    imageUri: string,
    fileName: string,
    opts: ProcessOptions = {}
): Promise<string> {
    const { form, endpoint } = await buildFormData(imageUri, fileName, opts);

    // 🔥 FIX: AbortSignal.timeout ki jagah purana reliable tareeqa
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: form,
            signal: controller.signal
        });

        clearTimeout(id); // Request kamyab ho gayi toh timer khatam

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Backend Error (${res.status}): ${errorText}`);
        }

        const blob = await res.blob();
        if (Platform.OS === 'web') return URL.createObjectURL(blob);

        const timestamp = Date.now();
        const localPath = `${FileSystem.cacheDirectory}processed_${timestamp}.png`;
        const base64 = await blobToBase64(blob);
        await FileSystem.writeAsStringAsync(localPath, base64, { encoding: FileSystem.EncodingType.Base64 });
        return localPath;

    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            console.error("[AI] Timeout: Backend ne bohot dair laga di.");
        } else {
            console.error("[AI] Critical Error:", error.message);
        }
        throw error;
    }
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
