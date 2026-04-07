import { create } from "zustand";

import type { LocalImage, Background } from "@/types";

const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
import { PREDEFINED_BACKGROUNDS } from "@/constants/backgrounds";

// 
interface StudioState {
    // Queued local images before/during/after processing
    images: LocalImage[];
    selectedImageId: string | null;
    selectedBackground: Background | null;

    // UI state
    isProcessing: boolean;
    processingProgress: number; // 0–100
    currentJobId: string | null; // DB record ID of the image currently being processed

    // Background selection
    backgrounds: Background[];
    customBackgrounds: Background[];

    // Actions
    addImages: (newImages: Omit<LocalImage, "id" | "status">[]) => void;
    removeImage: (id: string) => void;
    clearAll: () => void;
    selectImage: (id: string | null) => void;
    setImageStatus: (
        id: string,
        status: LocalImage["status"],
        processedUri?: string,
        error?: string
    ) => void;
    selectBackground: (bg: Background | null) => void;
    addCustomBackground: (bg: Background) => void;
    setProcessing: (isProcessing: boolean) => void;
    setProgress: (progress: number) => void;
    setCurrentJobId: (id: string | null) => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
    images: [],
    selectedImageId: null,
    selectedBackground: PREDEFINED_BACKGROUNDS[0],
    isProcessing: false,
    processingProgress: 0,
    currentJobId: null,
    backgrounds: PREDEFINED_BACKGROUNDS,
    customBackgrounds: [],

    addImages: (newImages) => {
        const mapped: LocalImage[] = newImages.map((img) => ({
            ...img,
            id: uuidv4(),
            status: "idle",
        }));
        set((state) => ({
            images: [...state.images, ...mapped],
            // Auto-select first image if none selected
            selectedImageId:
                state.selectedImageId ?? (mapped.length > 0 ? mapped[0].id : null),
        }));
    },

    removeImage: (id) => {
        set((state) => {
            const filtered = state.images.filter((img) => img.id !== id);
            return {
                images: filtered,
                selectedImageId:
                    state.selectedImageId === id
                        ? filtered.length > 0
                            ? filtered[0].id
                            : null
                        : state.selectedImageId,
            };
        });
    },

    clearAll: () => set({ images: [], selectedImageId: null }),

    selectImage: (id) => set({ selectedImageId: id }),

    setImageStatus: (id, status, processedUri, error) => {
        set((state) => ({
            images: state.images.map((img) =>
                img.id === id ? { ...img, status, processedUri, error } : img
            ),
        }));
    },

    selectBackground: (bg) => set({ selectedBackground: bg }),

    addCustomBackground: (bg) => {
        set((state) => ({
            customBackgrounds: [bg, ...state.customBackgrounds],
            selectedBackground: bg,
        }));
    },

    setProcessing: (isProcessing) => set({ isProcessing }),
    setProgress: (processingProgress) => set({ processingProgress }),
    setCurrentJobId: (currentJobId) => set({ currentJobId }),
}));

// Derived selectors
export const selectCurrentImage = (state: StudioState) =>
    state.images.find((img) => img.id === state.selectedImageId) ?? null;

export const selectAllBackgrounds = (state: StudioState) => [
    ...state.customBackgrounds,
    ...state.backgrounds,
];
