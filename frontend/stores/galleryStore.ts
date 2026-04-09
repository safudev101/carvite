import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GalleryImage {
    id: string;
    uri: string;
    type: 'transparent' | 'enhanced';
    createdAt: string;
}

interface GalleryState {
    images: GalleryImage[];
    addImage: (img: GalleryImage) => void;
    removeImage: (id: string) => void;
}

export const useGalleryStore = create<GalleryState>()(
    persist(
        (set) => ({
            images: [],
            addImage: (img) => set((state) => ({ images: [img, ...state.images] })),
            removeImage: (id) => set((state) => ({ images: state.images.filter(i => i.id !== id) })),
        }),
        {
            name: 'gallery-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
