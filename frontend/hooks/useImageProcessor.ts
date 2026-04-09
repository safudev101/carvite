import { useStudioStore } from '@/stores/studioStore';
import { useGalleryStore } from '@/stores/galleryStore';
import { processSingleImage, ProcessOptions } from '@/services/aiProcessing';

export const useImageProcessor = () => {
    const { addImageToGallery } = useGalleryStore();

    /**
     * EK SINGLE IMAGE KO PROCESS KARNE KA LOGIC
     * @param imageId - Jis image ko process karna hai
     * @param isBgRemoval - Agar true hai toh 'remove' action jayega, warna 'replace'
     */
    const processSingleImageAction = async (imageId: string, isBgRemoval: boolean) => {
        const { 
            images, 
            updateImageStatus, 
            updateImageResult, 
            setIsProcessing, 
            setProcessingProgress, 
            selectedBackground 
        } = useStudioStore.getState();

        const targetImage = images.find(img => img.id === imageId);
        
        // Agar image na milay ya pehle se process ho rahi ho toh ruk jao
        if (!targetImage || targetImage.status === 'processing') return;

        setIsProcessing(true);
        setProcessingProgress(5); 
        updateImageStatus(imageId, 'processing');

        let progressInterval: NodeJS.Timeout | undefined;

        try {
            // 🌟 Naye Backend Logic ke mutabiq Options set karein
            const opts: ProcessOptions = {
                // Agar isBgRemoval true hai toh action 'remove' hoga, warna 'replace'
                action: isBgRemoval ? 'remove' : 'replace',
                
                // Background details sirf 'replace' mode mein bhejni hain
                bgUrl: isBgRemoval ? undefined : selectedBackground?.url,
                bg_color: isBgRemoval ? undefined : selectedBackground?.color,
                
                // Transparent result ke liye PNG format best hai
                outputFormat: isBgRemoval ? "PNG" : "JPG"
            };

            // Smooth Progress Bar Logic
            let currentProgress = 10;
            progressInterval = setInterval(() => {
                if (currentProgress < 90) {
                    currentProgress += Math.random() * 5;
                    setProcessingProgress(Math.min(Math.floor(currentProgress), 90));
                }
            }, 800);

            // API Call - Backend ko updated options ke sath bhejna
            const resultUri = await processSingleImage(targetImage.uri, targetImage.fileName, opts);
            
            if (progressInterval) clearInterval(progressInterval);
            setProcessingProgress(100);

            // Result update karo UI mein
            updateImageResult(imageId, resultUri);
            updateImageStatus(imageId, 'done');

            // GALLERY INTEGRATION
            addImageToGallery({
                id: `gal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                uri: resultUri,
                originalUri: targetImage.uri,
                type: isBgRemoval ? 'transparent' : 'enhanced',
                createdAt: new Date().toISOString()
            });

        } catch (error: any) {
            if (progressInterval) clearInterval(progressInterval);
            updateImageStatus(imageId, 'error');
            console.error("[Processor] Error processing image:", error.message);
        } finally {
            // Loader reset
            setTimeout(() => {
                setIsProcessing(false);
                setProcessingProgress(0);
            }, 1000);
        }
    };

    /**
     * BATCH PROCESSING
     */
    const processAllImages = async (isBgRemoval: boolean = false) => {
        const { images } = useStudioStore.getState();
        const pendingImages = images.filter(img => img.status === 'idle' || img.status === 'error');

        for (const img of pendingImages) {
            // Har image ko bari bari process karein
            await processSingleImageAction(img.id, isBgRemoval);
        }
    };

    return { 
        processSingleImageAction, 
        processAllImages 
    };
};
