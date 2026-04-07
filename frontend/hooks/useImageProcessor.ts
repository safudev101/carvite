import { useCallback } from "react";
import { useStudioStore } from "@/stores/studioStore";
import { useAuthStore } from "@/stores/authStore";
import { processSingleImage as processCarImage } from "@/services/aiProcessing";
import { uploadRawImage, uploadProcessedImage, createImageRecord, markImageCompleted, markImageError } from "@/services/supabase";
import { compressImage, generateOutputFileName } from "@/services/imageUtils";
export function useImageProcessor() {
    const studioStore = useStudioStore();
    const { user } = useAuthStore();

    /**
     * Process a single image: AI removal → composite → upload → save DB record.
     */
    const processSingleImage = useCallback(
        async (imageId: string) => {
            const image = studioStore.images.find((img) => img.id === imageId);
            const background = studioStore.selectedBackground;

            if (!image || !user) return;

            // Mark as processing
            studioStore.setImageStatus(imageId, "processing");

            try {
                // 1. Upload original to Supabase Storage
                const originalUrl = await uploadRawImage(
                    image.uri,
                    user.id,
                    image.fileName || "original.jpg"
                );

                // 2. Create pending DB record
                const dbImageId = await createImageRecord({
                    userId: user.id,
                    originalUrl,
                    fileName: image.fileName || "car.jpg",
                    fileSize: image.fileSize,
                    backgroundId: background?.id,
                });

                // 3. Process image via AI
                const startMs = Date.now();
                const processingPromise = processCarImage(
                    image.uri,
                    image.fileName ?? "car.jpg",
                    {
                        bgUrl: background?.fullUrl,
                        outputFormat: "WEBP",
                        quality: 90,
                    }
                );

                const resultUri = await processingPromise;

                if (!resultUri) {
                    await markImageError(dbImageId, "API returned empty result");
                    studioStore.setImageStatus(imageId, "error", undefined, "API returned empty");
                    return;
                }

                // 4. Upload processed image
                const processedUrl = await uploadProcessedImage(
                    resultUri,
                    user.id,
                    dbImageId
                );

                // 5. Mark record completed
                const processingTimeMs = Date.now() - startMs;
                await markImageCompleted(dbImageId, processedUrl, processingTimeMs);

                // 6. Update local state
                studioStore.setImageStatus(imageId, "done", resultUri);
            } catch (err: any) {
                studioStore.setImageStatus(imageId, "error", undefined, err.message);
            }
        },
        [studioStore, user]
    );

    /**
     * Process all queued images in sequence with progress tracking.
     */
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
        // Store se values nikal kar yahan return karein taake component ko mil saken
        isProcessing: studioStore.isProcessing,
        currentJobId: studioStore.currentJobId // Agar store mein currentJobId nahi hai, to isay null bhi rakh sakte hain
    };
}