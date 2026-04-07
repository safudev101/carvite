import { Background } from "@/types";

// Using high-quality royalty-free images from Unsplash as defaults.
// In production, host these in Supabase Storage.
export const PREDEFINED_BACKGROUNDS: Background[] = [
    {
        id: "bg_showroom_white",
        label: "White Showroom",
        category: "showroom",
        isPremium: false,
        thumbnailUrl:
            "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&q=70",
        fullUrl:
            "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1920&q=90",
    },
    {
        id: "bg_showroom_dark",
        label: "Dark Showroom",
        category: "showroom",
        isPremium: false,
        thumbnailUrl:
            "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=200&q=70",
        fullUrl:
            "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1920&q=90",
    },
    {
        id: "bg_outdoor_mountain",
        label: "Mountain Road",
        category: "outdoor",
        isPremium: false,
        thumbnailUrl:
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=70",
        fullUrl:
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=90",
    },
    {
        id: "bg_outdoor_city",
        label: "City Night",
        category: "outdoor",
        isPremium: false,
        thumbnailUrl:
            "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=200&q=70",
        fullUrl:
            "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=90",
    },
    {
        id: "bg_studio_gradient_dark",
        label: "Studio Dark",
        category: "studio",
        isPremium: false,
        thumbnailUrl:
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=70",
        fullUrl:
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=90",
    },
    {
        id: "bg_outdoor_desert",
        label: "Desert Highway",
        category: "outdoor",
        isPremium: true,
        thumbnailUrl:
            "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=200&q=70",
        fullUrl:
            "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1920&q=90",
    },
    {
        id: "bg_showroom_luxury",
        label: "Luxury Garage",
        category: "showroom",
        isPremium: true,
        thumbnailUrl:
            "https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=200&q=70",
        fullUrl:
            "https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=1920&q=90",
    },
    {
        id: "bg_gradient_blue",
        label: "Arctic Blue",
        category: "gradient",
        isPremium: false,
        thumbnailUrl:
            "https://images.unsplash.com/photo-1536152470836-b943b246224c?w=200&q=70",
        fullUrl:
            "https://images.unsplash.com/photo-1536152470836-b943b246224c?w=1920&q=90",
    },
];

export const BACKGROUND_CATEGORIES = [
    { id: "all", label: "All" },
    { id: "showroom", label: "Showroom" },
    { id: "outdoor", label: "Outdoor" },
    { id: "studio", label: "Studio" },
    { id: "gradient", label: "Gradient" },
    { id: "custom", label: "Custom" },
] as const;