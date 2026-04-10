import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE = "https://khan19970-carvite.hf.space";

export interface ProcessOptions {
    bgUrl?: string;
    bg_color?: string;
}

async function buildFormData(imageUri: string, fileName: string, opts: ProcessOptions): Promise<{ form: FormData; endpoint: string }> {
    const form = new FormData();
    const action = (opts.bgUrl || opts.bg_color) ? 'replace' : 'remove';
    form.append('action', action);
    
    let endpoint = "/process"; 

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
    }
    return { form, endpoint };
}

export async function processSingleImage(imageUri: string, fileName: string, opts: ProcessOptions = {}): Promise<string> {
    const { form, endpoint } = await buildFormData(imageUri, fileName, opts);

    // FIX: Manual AbortController (Signal.timeout fix)
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
        if (blob.size === 0) throw new Error("Empty response from AI");

        if (Platform.OS === 'web') {
            return URL.createObjectURL(blob);
        } else {
            const timestamp = Date.now();
            const localPath = `${FileSystem.cacheDirectory}processed_${timestamp}.png`;
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                    const base64 = (reader.result as string).split(',')[1];
                    await FileSystem.writeAsStringAsync(localPath, base64, { encoding: FileSystem.EncodingType.Base64 });
                    resolve(localPath);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        throw error;
    }
}
