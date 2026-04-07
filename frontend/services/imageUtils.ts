/**
 * imageUtils.ts
 * Utility functions for image manipulation, validation, compression,
 * and download — works across Web, iOS, and Android.
 */

import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";

// ─── Constants ────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageDimensions {
    width: number;
    height: number;
}

export interface ImageInfo {
    uri: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    aspectRatio?: number;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export interface CompressOptions {
    maxWidthOrHeight?: number;
    quality?: number; // 0–1
    format?: "jpeg" | "png" | "webp";
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate a single image file before uploading.
 */
export function validateImageFile(
    fileName: string,
    fileSize: number,
    mimeType?: string
): ValidationResult {
    // File size check
    if (fileSize > MAX_FILE_SIZE_BYTES) {
        return {
            valid: false,
            error: `File "${fileName}" is too large. Max allowed size is ${MAX_FILE_SIZE_MB}MB.`,
        };
    }

    // Extension check
    const ext = getExtension(fileName).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        return {
            valid: false,
            error: `File "${fileName}" has an unsupported format. Use JPG, PNG, or WEBP.`,
        };
    }

    // MIME type check (if provided)
    if (mimeType && !ACCEPTED_MIME_TYPES.includes(mimeType.toLowerCase())) {
        return {
            valid: false,
            error: `File "${fileName}" has an unsupported MIME type: ${mimeType}.`,
        };
    }

    return { valid: true };
}

/**
 * Validate a batch of images and return valid ones + a list of errors.
 */
export function validateImageBatch(
    files: { fileName: string; fileSize: number; mimeType?: string }[]
): {
    validFiles: typeof files;
    errors: string[];
} {
    const validFiles: typeof files = [];
    const errors: string[] = [];

    for (const file of files) {
        const result = validateImageFile(file.fileName, file.fileSize, file.mimeType);
        if (result.valid) {
            validFiles.push(file);
        } else {
            errors.push(result.error!);
        }
    }

    return { validFiles, errors };
}

// ─── File Info ────────────────────────────────────────────────────────────────

/**
 * Get file extension including the dot, e.g. ".jpg"
 */
export function getExtension(fileName: string): string {
    const parts = fileName.split(".");
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
}

/**
 * Get MIME type from file extension.
 */
export function getMimeType(fileName: string): string {
    const ext = getExtension(fileName).toLowerCase();
    const map: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    };
    return map[ext] ?? "image/jpeg";
}

/**
 * Format file size to human-readable string.
 * e.g. 1048576 → "1.0 MB"
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generate a safe, timestamped file name for processed output.
 * e.g. "my car.jpg" → "autovisio_my-car_1718123456.webp"
 */
export function generateOutputFileName(
    originalName: string,
    outputFormat: "webp" | "jpeg" | "png" = "webp"
): string {
    const baseName = originalName
        .replace(/\.[^/.]+$/, "") // remove extension
        .replace(/\s+/g, "-")     // spaces → hyphens
        .replace(/[^a-zA-Z0-9_-]/g, "") // remove special chars
        .slice(0, 40);             // truncate

    const timestamp = Date.now();
    const ext = outputFormat === "jpeg" ? "jpg" : outputFormat;
    return `autovisio_${baseName}_${timestamp}.${ext}`;
}

// ─── Image Manipulation ───────────────────────────────────────────────────────

/**
 * Compress and optionally resize an image before uploading to save bandwidth.
 * Uses expo-image-manipulator (works on iOS, Android, and Web).
 */
export async function compressImage(
    uri: string,
    options: CompressOptions = {}
): Promise<{ uri: string; width: number; height: number }> {
    const {
        maxWidthOrHeight = 1920,
        quality = 0.88,
        format = "jpeg",
    } = options;

    const actions: ImageManipulator.Action[] = [
        {
            resize: {
                width: maxWidthOrHeight,
                // height is automatically calculated to preserve aspect ratio
            },
        },
    ];

    const formatMap: Record<string, ImageManipulator.SaveFormat> = {
        jpeg: ImageManipulator.SaveFormat.JPEG,
        png: ImageManipulator.SaveFormat.PNG,
        webp: ImageManipulator.SaveFormat.WEBP,
    };

    const result = await ImageManipulator.manipulateAsync(uri, actions, {
        compress: quality,
        format: formatMap[format] ?? ImageManipulator.SaveFormat.JPEG,
    });

    return {
        uri: result.uri,
        width: result.width,
        height: result.height,
    };
}

/**
 * Get the natural dimensions of an image from a URI.
 */
export function getImageDimensions(uri: string): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
        if (Platform.OS === "web") {
            const img = new window.Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => reject(new Error("Failed to load image for dimension check."));
            img.src = uri;
        } else {
            // On native, use Image.getSize from react-native
            const { Image } = require("react-native");
            Image.getSize(
                uri,
                (width: number, height: number) => resolve({ width, height }),
                (err: Error) => reject(err)
            );
        }
    });
}

/**
 * Calculate aspect ratio as a decimal (width / height).
 */
export function getAspectRatio(width: number, height: number): number {
    return height === 0 ? 1 : width / height;
}

/**
 * Calculate scaled dimensions to fit within a bounding box while
 * preserving aspect ratio.
 *
 * e.g. fitWithin(3000, 2000, 800, 600) → { width: 800, height: 533 }
 */
export function fitWithin(
    srcWidth: number,
    srcHeight: number,
    maxWidth: number,
    maxHeight: number
): ImageDimensions {
    const widthRatio = maxWidth / srcWidth;
    const heightRatio = maxHeight / srcHeight;
    const ratio = Math.min(widthRatio, heightRatio, 1); // never upscale
    return {
        width: Math.round(srcWidth * ratio),
        height: Math.round(srcHeight * ratio),
    };
}

// ─── Download ─────────────────────────────────────────────────────────────────

/**
 * Download a processed image to the user's device.
 *
 * - Web: triggers browser download via <a> tag
 * - iOS/Android: saves to camera roll via MediaLibrary
 */
export async function downloadImage(
    uri: string,
    fileName: string
): Promise<{ success: boolean; error?: string }> {
    try {
        if (Platform.OS === "web") {
            const link = document.createElement("a");
            link.href = uri;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return { success: true };
        }

        // Native: request permission, save to gallery
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
            return { success: false, error: "Gallery permission was denied." };
        }

        let localUri = uri;
        if (uri.startsWith("http://") || uri.startsWith("https://")) {
            // FIX: Using 'as any' to bypass the Property 'cacheDirectory' does not exist error
            const fsAny = FileSystem as any;
            const cacheDir = fsAny.cacheDirectory || fsAny.documentDirectory;

            if (!cacheDir) {
                return { success: false, error: "Storage directory not available." };
            }

            const downloadDest = `${cacheDir}${fileName}`;
            const downloadResult = await FileSystem.downloadAsync(uri, downloadDest);

            if (downloadResult.status !== 200) {
                return { success: false, error: "Failed to download image file." };
            }
            localUri = downloadResult.uri;
        }

        await MediaLibrary.saveToLibraryAsync(localUri);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message ?? "Download failed." };
    }
}
/**
 * Download all processed images in a batch.
 * On web, triggers sequential browser downloads.
 * On native, saves each to camera roll.
 */
export async function downloadBatch(
    images: { uri: string; fileName: string }[],
    onProgress?: (completed: number, total: number) => void
): Promise<{ successCount: number; failCount: number }> {
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < images.length; i++) {
        const { uri, fileName } = images[i];
        const result = await downloadImage(uri, fileName);
        if (result.success) {
            successCount++;
        } else {
            failCount++;
        }
        onProgress?.(i + 1, images.length);

        // Small delay between web downloads to avoid browser blocking
        if (Platform.OS === "web" && i < images.length - 1) {
            await delay(350);
        }
    }

    return { successCount, failCount };
}

// ─── Data URI Helpers ─────────────────────────────────────────────────────────

/**
 * Convert a Blob to a base64 data URI string.
 */
export function blobToDataUri(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to convert blob to data URI."));
        reader.readAsDataURL(blob);
    });
}

/**
 * Convert a base64 data URI to a Blob.
 */
export function dataUriToBlob(dataUri: string): Blob {
    const [header, base64] = dataUri.split(",");
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
}

/**
 * Estimate the file size of a base64 data URI in bytes.
 */
export function estimateBase64Size(dataUri: string): number {
    const base64 = dataUri.split(",")[1] ?? "";
    // Each base64 char represents 6 bits; 4 chars = 3 bytes
    const padding = (base64.match(/=+$/) ?? [""])[0].length;
    return (base64.length * 3) / 4 - padding;
}

// ─── Color / Canvas Helpers ───────────────────────────────────────────────────

/**
 * Generate a solid-color background as a data URI.
 * Useful for testing without the backend.
 */
export function generateColorBackground(
    width: number,
    height: number,
    hexColor: string = "#1A1A1E"
): string {
    if (Platform.OS !== "web") {
        // On native, just return a placeholder URI — canvas not available
        return "";
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = hexColor;
    ctx.fillRect(0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Create a canvas-based before/after thumbnail for sharing.
 * (Web only — used for generating social previews.)
 */
export function createSideBySideThumbnail(
    beforeUri: string,
    afterUri: string,
    outputWidth: number = 800
): Promise<string> {
    if (Platform.OS !== "web") {
        return Promise.resolve("");
    }

    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const halfW = outputWidth / 2;
        const outputHeight = Math.round(halfW * 0.65);
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext("2d")!;

        const beforeImg = new window.Image();
        const afterImg = new window.Image();

        beforeImg.crossOrigin = "anonymous";
        afterImg.crossOrigin = "anonymous";

        let loaded = 0;
        const tryDraw = () => {
            loaded++;
            if (loaded < 2) return;
            try {
                // Draw before (left)
                ctx.drawImage(beforeImg, 0, 0, halfW, outputHeight);
                // Draw after (right)
                ctx.drawImage(afterImg, halfW, 0, halfW, outputHeight);
                // Divider line
                ctx.strokeStyle = "#C9A84C";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(halfW, 0);
                ctx.lineTo(halfW, outputHeight);
                ctx.stroke();
                resolve(canvas.toDataURL("image/jpeg", 0.88));
            } catch (e) {
                reject(e);
            }
        };

        beforeImg.onload = tryDraw;
        afterImg.onload = tryDraw;
        beforeImg.onerror = reject;
        afterImg.onerror = reject;
        beforeImg.src = beforeUri;
        afterImg.src = afterUri;
    });
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}