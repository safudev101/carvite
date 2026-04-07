// ─── User & Auth ────────────────────────────────────────────────────────────

export interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    role: "user" | "admin";
    created_at: string;
}

// ─── Images ─────────────────────────────────────────────────────────────────

export type ImageStatus = "idle" | "uploading" | "processing" | "done" | "error";

export interface CarImage {
    id: string;
    user_id: string;
    original_url: string;
    processed_url?: string;
    background_id?: string;
    status: ImageStatus;
    created_at: string;
    file_name: string;
    file_size: number;
    width?: number;
    height?: number;
}

export interface LocalImage {
    id: string;            // temp UUID before upload
    uri: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    status: ImageStatus;
    processedUri?: string;
    backgroundId?: string;
    error?: string;
}

// ─── Backgrounds ─────────────────────────────────────────────────────────────

export type BackgroundCategory = "showroom" | "outdoor" | "studio" | "gradient" | "custom";

export interface Background {
    id: string;
    label: string;
    thumbnailUrl: string;
    fullUrl: string;
    category: BackgroundCategory;
    isPremium: boolean;
}

// ─── Processing ──────────────────────────────────────────────────────────────

export interface ProcessingRequest {
    imageUri: string;
    backgroundId?: string;
    backgroundUri?: string;
}

export interface ProcessingResult {
    success: boolean;
    processedUri?: string;
    error?: string;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminStats {
    total_users: number;
    total_images_processed: number;
    images_today: number;
    active_users_this_week: number;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export type Theme = "light" | "dark";

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
    index: undefined;
    "(auth)/login": undefined;
    "(auth)/signup": undefined;
    "(dashboard)/index": undefined;
    "(dashboard)/gallery": undefined;
    "(dashboard)/settings": undefined;
    "(admin)/index": undefined;
};