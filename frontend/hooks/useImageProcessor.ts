import { useStudioStore } from '@/stores/studioStore';
import { useGalleryStore } from '@/stores/galleryStore';
// ✅ Safe Import with curly braces
import { processSingleImage } from '@/services/aiProcessing';

export const useImageProcessor = () => {
    const { addImageToGallery } = useGalleryStore();

const processSingleImageAction = async (imageId: string, isBgRemoval: boolean) => {
    console.log("🚀 processing single image:", imageId);

    // ✅ SAFE STORE ACCESS
    const store = useStudioStore.getState();

    const images = store.images;
    const setImageStatus = store.setImageStatus;
    const setProcessing = store.setProcessing;
    const setProgress = store.setProgress;
    const selectedBackground = store.selectedBackground;

    // ✅ SAFETY CHECK (IMPORTANT)
    if (
        typeof setProcessing !== "function" ||
        typeof setImageStatus !== "function" ||
        typeof setProgress !== "function"
    ) {
        console.error("❌ Store functions missing!", {
            setProcessing,
            setImageStatus,
            setProgress,
        });
        return;
    }

    console.log("🧠 Store check:", {
        setProcessing: typeof setProcessing,
        setImageStatus: typeof setImageStatus,
        setProgress: typeof setProgress,
    });

    const targetImage = images.find(img => img.id === imageId);

    if (!targetImage) {
        console.error("❌ Image not found");
        return;
    }

    if (targetImage.status === 'processing') return;

    const imageUri = targetImage.uri;

    if (!imageUri) {
        console.error("❌ imageUri missing");
        return;
    }

    console.log("📸 URI:", imageUri);

    // ✅ START PROCESSING
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

        // 🔥 FAKE PROGRESS (optional but safe)
        progressInterval = setInterval(() => {
            useStudioStore.setState(state => ({
                processingProgress: Math.min(state.processingProgress + 5, 90)
            }));
        }, 
                                       
            // ✅ FETCH IMAGE (WEB SAFE)
        let fileData;

        if (Platform.OS === 'web') {
            const response = await fetch(imageUri);
            fileData = await response.blob();
        } else {
            fileData = imageUri;
        }
            // 🚀 Call the function (Checking if it's actually a function first)
            if (typeof processSingleImage !== 'function') {
                throw new Error("Critical: processSingleImage is not a function. Check imports.");
            }

             // ✅ API CALL (FIXED ENDPOINT)
            const res = await fetch("https://huggingface.co/spaces/Khan19970/carvite/process", {
            method: "POST",
            body: formData,
        });

            const data = await res.json();

        if (!res.ok) {
            throw new Error(data?.error || "Processing failed");
        }

        // ✅ SUCCESS
        clearInterval(progressInterval);
        setProgress(100);

            useStudioStore.setState(state => ({
            images: state.images.map(img =>
                img.id === imageId
                    ? { ...img, status: "done", resultUri: data.imageUrl }
                    : img
            )
        }));

    }     catch (err) {
          console.error("❌ Processing error:", err);

          clearInterval(progressInterval);

         setImageStatus(imageId, "error");
    } finally {
        setProcessing(false);
    }
};
            

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
