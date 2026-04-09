import { useStudioStore } from '@/stores/studioStore';
import { useGalleryStore } from '@/stores/galleryStore';
import { processSingleImage } from '@/services/aiProcessing';

export const useImageProcessor = () => {
    const { addImageToGallery } = useGalleryStore();

    /**
     * EK SINGLE IMAGE KO PROCESS KARNE KA LOGIC
     * @param imageId - Jis image ko process karna hai
     * @param isBgRemoval - Agar true hai toh transparent PNG banayega, warna background replace karega
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
        setProcessingProgress(5); // Initial kick
        updateImageStatus(imageId, 'processing');

        let progressInterval: NodeJS.Timeout;

        try {
            // Options set karein backend ke liye
            const opts = {
                // Agar "Remove BG" dabaya hai toh background ki details nahi bhejni
                bgUrl: isBgRemoval ? undefined : selectedBackground?.url,
                bg_color: isBgRemoval ? undefined : selectedBackground?.color,
                // Transparent result ke liye PNG format lazmi hai
                outputFormat: isBgRemoval ? "PNG" : "JPG" as any
            };

            // 🌟 Smooth Progress Bar Logic (90% tak khud jaye gi)
            let currentProgress = 10;
            progressInterval = setInterval(() => {
                if (currentProgress < 90) {
                    currentProgress += Math.random() * 5;
                    setProcessingProgress(Math.min(Math.floor(currentProgress), 90));
                }
            }, 800);

            // API Call - Backend ko image bhejna
            const resultUri = await processSingleImage(targetImage.uri, targetImage.fileName, opts);
            
            // Interval khatam karo aur progress 100 kardo
            clearInterval(progressInterval);
            setProcessingProgress(100);

            // Result update karo UI mein
            updateImageResult(imageId, resultUri);
            updateImageStatus(imageId, 'done');

            // 🌟 GALLERY INTEGRATION
            // Image tayyar hotay hi usay gallery store mein daal do
            addImageToGallery({
                id: `gal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                uri: resultUri,
                originalUri: targetImage.uri,
                type: isBgRemoval ? 'transparent' : 'enhanced',
                createdAt: new Date().toISOString()
            });

        } catch (error: any) {
            if (progressInterval!) clearInterval(progressInterval);
            updateImageStatus(imageId, 'error');
            console.error("[Processor] Error processing image:", error.message);
        } finally {
            // Thora ruk kar progress bar aur loader reset karo
            setTimeout(() => {
                setIsProcessing(false);
                setProcessingProgress(0);
            }, 1000);
        }
    };

    /**
     * BATCH PROCESSING (Agar saari images ek sath karni hon)
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
        processAllImages 
    };
};
