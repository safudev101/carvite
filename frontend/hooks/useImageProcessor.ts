import { useCallback } from "react";
import { useStudioStore } from "@/stores/studioStore";
import { useAuthStore } from "@/stores/authStore";
import { processSingleImage as processCarImage } from "@/services/aiProcessing";

// 🌟 Agar aapka koi useGalleryStore hai (Gallery Tab ke liye), toh yahan import karein:
// import { useGalleryStore } from "@/stores/galleryStore";

export function useImageProcessor() {
    const studioStore = useStudioStore();
    const { user } = useAuthStore();
    
    // const addImageToGallery = useGalleryStore(state => state.addImage); // 🌟 (Gallery ke liye uncomment karein)

    // 👇 NAYA FUNCTION: Sirf Ek Image Ko Process Karne Ke Liye
    const processSingleImageAction = useCallback(async (imageId: string, removeBgOnly: boolean = false) => {
        const image = studioStore.images.find((img) => img.id === imageId);
        
        if (!image || !user || image.status === 'processing') return;

        const background = removeBgOnly ? null : studioStore.selectedBackground;

        // UI Updates: Processing Start
        studioStore.setProcessing(true);
        studioStore.setImageStatus(imageId, "processing");
        studioStore.setProgress(10); // Initial 10%

        // Smooth Fake Progress Bar Logic
        let currentProgress = 10;
        const progressInterval = setInterval(() => {
            currentProgress += Math.floor(Math.random() * 10) + 5; // 5 se 15% random jump
            if (currentProgress > 90) currentProgress = 90; // 90% pe ruka rahega jab tak result na aye
            studioStore.setProgress(currentProgress);
        }, 1000);

        try {
            const resultUri = await processCarImage(
                image.uri,
                image.fileName ?? "car.jpg",
                {
                    bgUrl: background?.fullUrl || undefined,
                    bgId: background?.category !== 'Custom' ? background?.id : undefined,
                    outputFormat: "PNG", 
                }
            );

            clearInterval(progressInterval); // Timer khatam

            if (!resultUri) throw new Error("API failed");
            
            // UI Updates: Processing Complete
            studioStore.setProgress(100);
            studioStore.setImageStatus(imageId, "done", resultUri);

            // 🌟 FIX: GALLERY TAB MEIN SAVE KARNA 🌟
            // Yahan aap gallery store ko result bhej do taake wahan nazar aaye
            // if (addImageToGallery) {
            //     addImageToGallery({ 
            //         id: `gal_${Date.now()}`, 
            //         uri: resultUri, 
            //         createdAt: new Date().toISOString() 
            //     });
            // }

        } catch (err: any) {
            clearInterval(progressInterval);
            console.error("AI Error:", err.message);
            studioStore.setImageStatus(imageId, "error", undefined, err.message);
        } finally {
            // Thori der baad dashboard ko normal state mein wapas lana
            setTimeout(() => {
                studioStore.setProcessing(false);
                studioStore.setProgress(0);
            }, 1200);
        }
    }, [studioStore, user]);

    // 👇 PURANA FUNCTION: Agar kabhi ek sath sab karni hon (Bulk mode)
    const processAllImages = useCallback(async (removeBgOnly: boolean = false) => {
        const idleImages = studioStore.images.filter((img) => img.status === "idle" || img.status === "error");
        if (idleImages.length === 0) return;

        studioStore.setProcessing(true);
        studioStore.setProgress(0);

        for (let i = 0; i < idleImages.length; i++) {
            await processSingleImageAction(idleImages[i].id, removeBgOnly);
            // Bulk mein progress per image update hogi
            studioStore.setProgress(Math.round(((i + 1) / idleImages.length) * 100));
        }

        studioStore.setProcessing(false);
    }, [studioStore, processSingleImageAction]);

    return { 
        processAllImages, 
        processSingleImageAction, // ✅ Ye lazmi export hona chahiye BulkUploader ke liye
        isProcessing: studioStore.isProcessing,
        processingProgress: studioStore.processingProgress 
    };
}
