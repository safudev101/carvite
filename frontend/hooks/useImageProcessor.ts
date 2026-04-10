import { useStudioStore } from '@/stores/studioStore';
import { useGalleryStore } from '@/stores/galleryStore';
// ✅ Safe Import with curly braces
import { processSingleImage } from '@/services/aiProcessing';

export const useImageProcessor = () => {
    const { addImageToGallery } = useGalleryStore();

    const processSingleImageAction = async (imageId: string, isBgRemoval: boolean) => {
        // State update using current store names
        const { 
            images, 
            setImageStatus, 
            setProcessing, 
            setProgress, 
            selectedBackground 
        } = useStudioStore.getState();

        const targetImage = images.find(img => img.id === imageId);
        if (!targetImage || targetImage.status === 'processing') return;

        setProcessing(true);
        setProgress(5); 
        setImageStatus(imageId, 'processing');

        let progressInterval: any;

        try {
            const opts = {
                bgUrl: isBgRemoval ? undefined : (selectedBackground?.fullUrl || selectedBackground?.thumbnailUrl),
            };

            // Fake progress animation
            let p = 5;
            progressInterval = setInterval(() => {
                p += Math.random() * 10;
                if (p > 90) p = 90;
                setProgress(Math.floor(p));
            }, 1000);

            // 🚀 Call the function (Checking if it's actually a function first)
            if (typeof processSingleImage !== 'function') {
                throw new Error("Critical: processSingleImage is not a function. Check imports.");
            }

            const resultUri = await processSingleImage(targetImage.uri, targetImage.name, opts);

            if (progressInterval) clearInterval(progressInterval);
            
            setProgress(100);
            setImageStatus(imageId, 'done', resultUri);

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
            console.error("[Processor] Fatal Error:", error.message);
        } finally {
            setTimeout(() => {
                setProcessing(false);
                setProgress(0);
            }, 1000);
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
