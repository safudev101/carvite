import { useStudioStore } from '@/stores/studioStore';
import { useGalleryStore } from '@/stores/galleryStore';
import { processSingleImage } from '@/services/aiProcessing';

export const useImageProcessor = () => {
    const { addImageToGallery } = useGalleryStore();

    /**
     * Single Image Process Action
     */
    const processSingleImageAction = async (imageId: string, isBgRemoval: boolean) => {
        console.log("🚀 Processing single image:", imageId);

        // 1. Get Store State
        const store = useStudioStore.getState();
        const { 
            images, 
            setImageStatus, 
            setProcessing, 
            setProgress, 
            selectedBackground 
        } = store;

        // 2. Safety Check for Store Functions
        if (typeof setProcessing !== "function" || typeof setImageStatus !== "function") {
            console.error("❌ Store functions missing!");
            return;
        }

        const targetImage = images.find(img => img.id === imageId);
        if (!targetImage || targetImage.status === 'processing') return;

        // 3. Start Processing UI
        setProcessing(true);
        setProgress(5);
        setImageStatus(imageId, 'processing');

        let progressInterval: any;

        try {
            const opts = {
                bgUrl: isBgRemoval 
                    ? undefined 
                    : (selectedBackground?.fullUrl || selectedBackground?.thumbnailUrl),
            };

            // 4. Fake Progress Animation
            progressInterval = setInterval(() => {
                const currentProgress = useStudioStore.getState().processingProgress;
                if (currentProgress < 90) {
                    setProgress(currentProgress + 2);
                }
            }, 1000);

            // 5. API Call via Service
            // Note: service/aiProcessing.ts ke andar CONFIG.API_BASE_URL ke sath 
            // endpoint (/process ya /replace-bg) automatic handle ho raha hai.
            if (typeof processSingleImage !== 'function') {
                throw new Error("Critical: processSingleImage service not found.");
            }

            const resultUri = await processSingleImage(targetImage.uri, targetImage.name || 'car.jpg', opts);

            // 6. Success Logic
            if (progressInterval) clearInterval(progressInterval);
            
            setProgress(100);
            setImageStatus(imageId, 'done', resultUri);

            // 7. Add to Gallery
            addImageToGallery({
                id: `gal_${Date.now()}`,
                uri: resultUri,
                originalUri: targetImage.uri,
                type: isBgRemoval ? 'transparent' : 'enhanced',
                createdAt: new Date().toISOString()
            });

        } catch (error: any) {
            if (progressInterval) clearInterval(progressInterval);
            setImageStatus(imageId, 'error', undefined, error.message);
            console.error("[Processor] Error:", error.message);
        } finally {
            // Reset loader after a delay
            setTimeout(() => {
                setProcessing(false);
                setProgress(0);
            }, 1500);
        }
    };

    /**
     * Process All Pending Images
     */
    const processAllImages = async (isBgRemoval: boolean = false) => {
        const { images } = useStudioStore.getState();
        const pendingImages = images.filter(img => img.status === 'idle' || img.status === 'error');
        
        for (const img of pendingImages) {
            await processSingleImageAction(img.id, isBgRemoval);
        }
    };

    return { 
        processSingleImageAction, 
        processAllImages,
        isProcessing: useStudioStore(state => state.isProcessing),
        processingProgress: useStudioStore(state => state.processingProgress)
    };
};
