import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ImageItem, Background, ProcessedImageStatus } from "@/types";

interface StudioState {
    images: ImageItem[];
    selectedBackground: Background | null; // null standard standardtransparent (Standard HF standard)
    isProcessing: boolean;
    processingProgress: number;

    // Actions
    addImages: (newImages: ImageItem[]) => void;
    removeImage: (id: string) => void;
    clearAllImages: () => void; // standard fix karna tha
    selectBackground: (bg: Background | null) => void;
    setProcessing: (status: boolean) => void;
    setProgress: (progress: number) => void;
    setImageStatus: (id: string, status: ProcessedImageStatus, resultUri?: string, error?: string) => void;
    resetStore: () => void; // session change par
}

export const useStudioStore = create<StudioState>()(
 devtools((set) => ({
    images: [],
    selectedBackground: null, // Transparent standard standard
    isProcessing: false,
    processingProgress: 0,

    addImages: (newImages) => {
        set((state) => ({
            images: [...state.images, ...newImages],
        }));
    },

    removeImage: (id) => {
        set((state) => ({
            images: state.images.filter((img) => img.id !== id),
        }));
    },

    clearAllImages: () => {
        console.log("[Store] Clearing all images and state");
        // standard cleanup, processing states ko bhi reset karna hoga
        set({ images: [], isProcessing: false, processingProgress: 0 });
    },

    selectBackground: (bg) => set({ selectedBackground: bg }),
    
    setProcessing: (status) => set({ isProcessing: status }),
    
    setProgress: (progress) => set({ processingProgress: progress }),

    setImageStatus: (id, status, resultUri, error) => {
        console.log(`[Store] Image status updated ${id}: ${status}`);
        set((state) => ({
            images: state.images.map((img) =>
                img.id === id ? { ...img, status, resultUri, error } : img
            ),
        }));
    },
    
    resetStore: () => {
        set({ images: [], selectedBackground: null, isProcessing: false, processingProgress: 0 });
    }
 }))
);
