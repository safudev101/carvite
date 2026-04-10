import { useStudioStore } from '@/stores/studioStore';
import { useGalleryStore } from '@/stores/galleryStore';
import { processSingleImage } from '@/services/aiProcessing';

export const useImageProcessor = () => {
    // ✅ FIXED: Aapke store mein function ka naam 'addImage' hai
    const { addImage } = useGalleryStore();

    /**
     * Single Image Process Action
     */
    const processSingleImageAction = async (imageId: string, isBgRemoval: boolean) => {
        console.log("🚀 Processing single image:", imageId);

        const store = useStudioStore.getState();
        const { 
            images, 
            setImageStatus, 
            setProcessing, 
            setProgress, 
            selectedBackground 
        } = store;

        if (typeof setProcessing !== "function" || typeof setImageStatus !== "function") {
            console.error("❌ Store functions missing!");
            return;
        }

        const targetImage = images.find(img => img.id === imageId);
        if (!targetImage || targetImage.status === 'processing') return;

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

            progressInterval = setInterval(() => {
                const currentProgress = useStudioStore.getState().processingProgress;
                if (currentProgress < 90) {
                    setProgress(currentProgress + 2);
                }
            }, 1000);

            if (typeof processSingleImage !== 'function') {
                throw new Error("Critical: processSingleImage service not found.");
            }

            const resultUri = await processSingleImage(targetImage.uri, targetImage.name || 'car.jpg', opts);

            if (progressInterval) clearInterval(progressInterval);
            
            setProgress(100);
            setImageStatus(imageId, 'done', resultUri);

            // ✅ FIXED: 'addImageToGallery' ki jagah 'addImage' use kiya hai
            addImage({
                id: `gal_${Date.now()}`,
                uri: resultUri,
                // originalUri aapke GalleryImage interface mein nahi tha, 
                // agar zaroorat ho toh interface update kar lena
                type: isBgRemoval ? 'transparent' : 'enhanced',
                createdAt: new Date().toISOString()
            });

        } catch (error: any) {
            if (progressInterval) clearInterval(progressInterval);
            setImageStatus(imageId, 'error', undefined, error.message);
            console.error("[Processor] Error:", error.message);
        } finally {
            setTimeout(() => {
                setProcessing(false);
                setProgress(0);
            }, 1500);
        }
    };

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
