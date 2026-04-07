import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
    return useAuthStore();
}

/**
 * Protects routes based on auth state and user role.
 * Call this once in the root _layout.tsx.
 */
export function useProtectedRoutes() {
    const { user, isInitialized } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isInitialized) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inAdminGroup = segments[0] === "(admin)";
        const inDashboardGroup = segments[0] === "(dashboard)";

        if (!user && !inAuthGroup && segments[0] !== undefined) {
            // Not logged in: redirect to landing or login
            router.replace("/");
        } else if (user && inAuthGroup) {
            // Already logged in: skip auth screens
            router.replace("/(dashboard)");
        } else if (inAdminGroup && user?.role !== "admin") {
            // Non-admins can't access admin panel
            router.replace("/(dashboard)");
        }
    }, [user, segments, isInitialized]);
}