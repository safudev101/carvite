import { useCallback } from "react";
import { useStudioStore } from "@/stores/studioStore";
import { useAuthStore } from "@/stores/authStore";
import { processSingleImage as processCarImage } from "@/services/aiProcessing";
import { uploadRawImage, uploadProcessedImage, createImageRecord, markImageCompleted, markImageError } from "@/services/supabase";

export function useImageProcessor() {
    const studioStore = useStudioStore();
    const { user } = useAuthStore();

    const processSingleImage = useCallback(
        async (imageId: string) => {
            const image = studioStore.images.find((img) => img.id === imageId);
            const background = studioStore.selectedBackground;

            if (!image || !user) return;

            studioStore.setImageStatus(imageId, "processing");

            try {
                // 1. Upload original to Supabase
                const originalUrl = await uploadRawImage(
                    image.uri,
                    user.id,
                    image.fileName || "original.jpg"
                );

                // 2. Create DB record
                const dbImageId = await createImageRecord({
                    userId: user.id,
                    originalUrl,
                    fileName: image.fileName || "car.jpg",
                    fileSize: image.fileSize,
                    backgroundId: background?.id,
                });

                // 3. Process image via AI
                const startMs = Date.now();
                
                // FIX: Yahan background handling sahi ki hai
                const resultUri = await processCarImage(
                    image.uri,
                    image.fileName ?? "car.jpg",
                    {
                        // Agar custom background hai toh .uri use hoga, warna .fullUrl
                        bgUrl: background?.category === 'Custom' ? background.fullUrl : background?.fullUrl,
                        bgId: background?.category !== 'Custom' ? background?.id : undefined,
                        outputFormat: "WEBP",
                        quality: 90,
                    }
                );

                if (!resultUri) throw new Error("API returned empty result");

                // 4. Upload processed image
                const processedUrl = await uploadProcessedImage(
                    resultUri,
                    user.id,
                    dbImageId
                );

                // 5. Complete
                const processingTimeMs = Date.now() - startMs;
                await markImageCompleted(dbImageId, processedUrl, processingTimeMs);

                studioStore.setImageStatus(imageId, "done", resultUri);
            } catch (err: any) {
                console.error("Processing Error:", err);
                studioStore.setImageStatus(imageId, "error", undefined, err.message);
            }
        },
        [studioStore, user]
    );

    const processAllImages = useCallback(async () => {
        const idleImages = studioStore.images.filter((img) => img.status === "idle");
        if (idleImages.length === 0) return;

        studioStore.setProcessing(true);
        studioStore.setProgress(0);

        for (let i = 0; i < idleImages.length; i++) {
            await processSingleImage(idleImages[i].id);
            studioStore.setProgress(Math.round(((i + 1) / idleImages.length) * 100));
        }

        studioStore.setProcessing(false);
    }, [studioStore, processSingleImage]);

    return {
        processSingleImage,
        processAllImages,
        isProcessing: studioStore.isProcessing,
    };
}
