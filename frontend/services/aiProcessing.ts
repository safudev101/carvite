import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// API Configuration
// Sirf is URL ko change karein. 
// Agar HuggingFace use karna hai toh switch ko false kar dein.
const CONFIG = {
    USE_CARCLINCH: true, 
    ACTIVE_URL: "https://your-carclinch-api.com", // Apna hosted URL yahan dalein
    FALLBACK_URL: "https://khan19970-carvite.hf.space"
};

export interface ProcessOptions {
    bgId?: string;
    bgUrl?: string;
    bgColor?: string;
    outputFormat?: 'WEBP' | 'JPEG' | 'PNG';
    quality?: number;
    addShadow?: boolean;
    carScale?: number;
}

async function buildFormData(imageUri: string, fileName: string, opts: ProcessOptions): Promise<FormData> {
    const form = new FormData();

    if (Platform.OS === 'web') {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        form.append('image', blob, fileName);
    } else {
        // Mobile fixed format
        form.append('image', {
            uri: imageUri,
            name: fileName || 'car_photo.jpg',
            type: 'image/jpeg', 
        } as any);
    }

    // Backend params (jo humne Python mein likhe hain)
    if (opts.bgUrl) form.append('bg_url', opts.bgUrl);
    if (opts.bgColor) form.append('bg_color', opts.bgColor);
    
    // Default values set to match our professional logic
    form.append('car_scale', String(opts.carScale ?? 0.88)); 

    return form;
}

export async function processSingleImage(
    imageUri: string, 
    fileName: string, 
    options?: ProcessingOptions
) {
    const formData = new FormData();
    const bgUri = options?.bgUrl;
    
    // Image fetch logic for Web and Mobile
    let imageBlob: any;
    if (Platform.OS === 'web') {
        const res = await fetch(imageUri);
        imageBlob = await res.blob();
    } else {
        // React Native specific format
        imageBlob = { uri: imageUri, name: fileName, type: 'image/jpeg' } as any;
    }

    // Determine current API base URL
    const baseUrl = CONFIG.USE_CARCLINCH ? CONFIG.ACTIVE_URL : CONFIG.FALLBACK_URL;

    try {
        if (CONFIG.USE_CARCLINCH) {
            // --- CarClinch API Logic ---
            const endpoint = bgUri ? '/replace-bg' : '/remove-bg';
            
            if (bgUri) {
                // Background Replace Mode
                formData.append('car_image', imageBlob);
                
                // Background fetch
                const bgRes = await fetch(bgUri);
                const bgBlob = await bgRes.blob();
                formData.append('bg_image', bgBlob, 'background.jpg');
            } else {
                // Simple Remove Mode
                formData.append('image', imageBlob);
            }

            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error(`CarClinch Error: ${response.status}`);
            
            const resultBlob = await response.blob();
            return URL.createObjectURL(resultBlob);

        } else {
            // --- Old HuggingFace Fallback ---
            formData.append('image', imageBlob);
            if (bgUri) formData.append('bg_url', bgUri); 
            
            const response = await fetch(`${baseUrl}/process`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('HuggingFace Error');
            const resultBlob = await response.blob();
            return URL.createObjectURL(resultBlob);
        }
    } catch (error: any) {
        console.error("Processing API Error:", error.message);
        throw error;
    }
}
