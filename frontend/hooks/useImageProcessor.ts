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

            if (!image || !user) {
                console.warn("[Processor] Skipping processing: Image or User missing.");
                return;
            }

            console.log(`[Processor] Shuru processing for ${image.id} with BG: ${background?.label ?? 'None'}`);
            studioStore.setImageStatus(imageId, "processing");

            try {
                // 1. Upload original to Supabase (taake save rahe)
                const originalUrl = await uploadRawImage(
                    image.uri,
                    user.id,
                    image.fileName || `car_${Date.now()}.jpg`
                );

                // 2. Create DB record
                const dbImageId = await createImageRecord({
                    userId: user.id,
                    originalUrl,
                    fileName: image.fileName || `car_${Date.now()}.jpg`,
                    fileSize: image.fileSize,
                    backgroundId: background?.category !== 'Custom' ? background?.id : undefined,
                });

                // 3. Process image via AI
                const startMs = Date.now();
                
                // OPTIMIZATION: Sirf BG details bhejo agar transparent/null NA ho.
                // Hugging Face standard 'transparent' tabhi karta hai jab standard checks pass hon.
                const processingOpts: any = {
                    outputFormat: "WEBP",
                    quality: 90,
                };

                if (background) {
                    processingOpts.bgUrl = background.fullUrl;
                    if (background.category !== 'Custom') {
                        processingOpts.bgId = background.id;
                    }
                } else {
                    // Agar 'Original' selected hai, to backend ko bolo transparent remove kare standard
                    processingOpts.transparent = true; 
                }

                const resultUri = await processCarImage(
                    image.uri,
                    image.fileName ?? "car.jpg",
                    processingOpts
                );

                if (!resultUri) throw new Error("AI API returned empty result");

                // 4. Upload processed image to Supabase
                const processedUrl = await uploadProcessedImage(
                    resultUri,
                    user.id,
                    dbImageId
                );

                // 5. Update DB and mark complete
                const processingTimeMs = Date.now() - startMs;
                await markImageCompleted(dbImageId, processedUrl, processingTimeMs);

                // 6. Final UI Update
                console.log("[Processor] Processing complete:", resultUri);
                studioStore.setImageStatus(imageId, "done", resultUri);
            } catch (err: any) {
                console.error("[Processor] Fatal Error:", err.message);
                // Taake UI par "FAILED" likha aaye aur loop break na ho
                studioStore.setImageStatus(imageId, "error", undefined, err.message);
            }
        },
        [studioStore, user]
    );

    const processAllImages = useCallback(async () => {
        // Sirf unhein process karo jo queued ya idle hain
        const pendingImages = studioStore.images.filter((img) => img.status === "idle" || img.status === "queued");
        if (pendingImages.length === 0) return;

        studioStore.setProcessing(true);
        studioStore.setProgress(0);

        for (let i = 0; i < pendingImages.length; i++) {
            await processSingleImage(pendingImages[i].id);
            studioStore.setProgress(Math.round(((i + 1) / pendingImages.length) * 100));
        }

        studioStore.setProcessing(false);
        studioStore.setProgress(100);
    }, [studioStore, processSingleImage]);

    return {
        processSingleImage,
        processAllImages,
        isProcessing: studioStore.isProcessing,
    };
}
