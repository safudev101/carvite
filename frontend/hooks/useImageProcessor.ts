import { useStudioStore } from '@/stores/studioStore';
import { useGalleryStore } from '@/stores/galleryStore';
import { processSingleImage } from '@/services/aiProcessing';

export const useImageProcessor = () => {
    const { addImageToGallery } = useGalleryStore();

    /**
     * Single Image Process logic
     */
    const processSingleImageAction = async (imageId: string, isBgRemoval: boolean) => {
        // StudioStore se state aur functions nikalna (Zustand)
        const { 
            images, 
            setImageStatus, 
            setProcessing, 
            setProgress, 
            selectedBackground 
        } = useStudioStore.getState();

        const targetImage = images.find(img => img.id === imageId);
        
        if (!targetImage || targetImage.status === 'processing') return;

        // UI Updates start
        setProcessing(true);
        setProgress(10); 
        setImageStatus(imageId, 'processing');

        let progressInterval: any;

        try {
            const opts = {
                // Agar Remove BG nahi hai toh background URL bhejein
                bgUrl: isBgRemoval ? undefined : selectedBackground?.thumbnailUrl || selectedBackground?.fullUrl,
            };

            // Fake progress badhane ke liye
            let p = 10;
            progressInterval = setInterval(() => {
                p += Math.random() * 8;
                if (p > 92) p = 92;
                setProgress(Math.floor(p));
            }, 1000);

            // Asli API Call
            const resultUri = await processSingleImage(targetImage.uri, targetImage.name, opts);

            if (progressInterval) clearInterval(progressInterval);
            
            setProgress(100);
            
            // Store update karein processed image ke saath
            setImageStatus(imageId, 'done', resultUri);

            // Gallery mein save karein
            addImageToGallery({
                id: `gal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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
            // Loader hatane ke liye thoda wait karein
            setTimeout(() => {
                setProcessing(false);
                setProgress(0);
            }, 1200);
        }
    };

    /**
     * Batch Processing logic
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
        // Helper state access
        isProcessing: useStudioStore(state => state.isProcessing),
        processingProgress: useStudioStore(state => state.processingProgress)
    };
};
