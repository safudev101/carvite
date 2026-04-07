import { useCallback } from "react";
import { useStudioStore } from "@/stores/studioStore";
import { useAuthStore } from "@/stores/authStore";
import { processSingleImage as processCarImage } from "@/services/aiProcessing";

export function useImageProcessor() {
    const studioStore = useStudioStore();
    const { user } = useAuthStore();

    const processSingleImage = useCallback(async (imageId: string) => {
        const image = studioStore.images.find((img) => img.id === imageId);
        const background = studioStore.selectedBackground;

        if (!image || !user) return;

        studioStore.setImageStatus(imageId, "processing");

        try {
            // Backend ko options bhejna
            const resultUri = await processCarImage(
                image.uri,
                image.fileName ?? "car.jpg",
                {
                    bgUrl: background?.fullUrl || undefined,
                    bgId: background?.category !== 'Custom' ? background?.id : undefined,
                    outputFormat: "WEBP",
                }
            );

            if (!resultUri) throw new Error("API failed");
            
            studioStore.setImageStatus(imageId, "done", resultUri);
        } catch (err: any) {
            console.error("AI Error:", err.message);
            studioStore.setImageStatus(imageId, "error", undefined, err.message);
        }
    }, [studioStore, user]);

    const processAllImages = useCallback(async () => {
        const idleImages = studioStore.images.filter((img) => img.status === "idle" || img.status === "error");
        if (idleImages.length === 0) return;

        studioStore.setProcessing(true);
        studioStore.setProgress(0);

        for (let i = 0; i < idleImages.length; i++) {
            await processSingleImage(idleImages[i].id);
            studioStore.setProgress(Math.round(((i + 1) / idleImages.length) * 100));
        }

        studioStore.setProcessing(false);
    }, [studioStore, processSingleImage]);

    return { processAllImages, isProcessing: studioStore.isProcessing };
}
