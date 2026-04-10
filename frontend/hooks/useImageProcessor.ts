import { useStudioStore } from '@/stores/studioStore';
import { useGalleryStore } from '@/stores/galleryStore';
import { processSingleImage } from '@/services/aiProcessing';

export const useImageProcessor = () => {
    const { addImageToGallery } = useGalleryStore();

    const processSingleImageAction = async (imageId: string, isBgRemoval: boolean) => {
        // Store functions updated to match studioStore.ts
        const { 
            images, 
            setImageStatus,  // updateImageStatus -> setImageStatus
            setProcessing,   // setIsProcessing -> setProcessing
            setProgress,      // setProcessingProgress -> setProgress
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
                bgUrl: isBgRemoval ? undefined : selectedBackground?.fullUrl, // Use fullUrl
                bg_color: undefined
            };

            // Fake progress animation
            let p = 5;
            progressInterval = setInterval(() => {
                p += Math.random() * 15;
                if (p > 90) p = 90;
                setProgress(Math.floor(p));
            }, 800);

            const resultUri = await processSingleImage(targetImage.uri, targetImage.name, opts);

            if (progressInterval) clearInterval(progressInterval);
            
            setProgress(100);
            setImageStatus(imageId, 'done', resultUri); // store function takes resultUri as 3rd param

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

    return { processSingleImageAction, processAllImages };
};
