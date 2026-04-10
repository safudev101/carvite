import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE = "https://khan19970-carvite.hf.space";

export interface ProcessOptions {
    bgUrl?: string;
    bg_color?: string;
}

async function buildFormData(imageUri: string, fileName: string, opts: ProcessOptions): Promise<{ form: FormData; endpoint: string }> {
    const form = new FormData();
    // Agar bgUrl ya bg_color hai toh matlab 'replace' karna hai, warna sirf 'remove'
    const actionType = (opts.bgUrl || opts.bg_color) ? "replace" : "remove";
    
    form.append('action', actionType);
    
    let endpoint = "/upload-image"; 

    const carImageData = Platform.OS === 'web' 
        ? await (await fetch(imageUri)).blob() 
        : { uri: imageUri, name: fileName || 'car_photo.jpg', type: 'image/jpeg' } as any;
    
    form.append('image', carImageData);

    if (opts.bgUrl) {
        if (opts.bgUrl.startsWith('http')) {
            form.append('bg_url', opts.bgUrl);
        } else {
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
    }

    return { form, endpoint };
}

export async function processSingleImage(
    imageUri: string,
    fileName: string,
    opts: ProcessOptions = {}
): Promise<string> {
    const { form, endpoint } = await buildFormData(imageUri, fileName, opts);

    // Safer Timeout logic
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
        clearTimeout(timeoutId);
        console.error("[AI] Critical Error:", error.message);
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
