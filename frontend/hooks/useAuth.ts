import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
    return useAuthStore();
}

export function useProtectedRoutes() {
    const { user, isInitialized } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isInitialized) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inAdminGroup = segments[0] === "(admin)";
        const isRoot = segments.length === 0 || segments[0] === "index" || segments[0] === undefined;

        if (!user) {
            // Agar user logged in nahi hai aur auth ke bahar jane ki koshish kare
            if (!inAuthGroup && !isRoot) {
                router.replace("/(auth)/login");
            }
        } else {
            // Agar user logged in hai aur login/signup ya landing page par ho
            if (inAuthGroup || isRoot) {
                router.replace("/(dashboard)");
            } 
            // Admin checks
            else if (inAdminGroup && user?.role !== "admin") {
                router.replace("/(dashboard)");
            }
        }
    }, [user, segments, isInitialized]);
}
