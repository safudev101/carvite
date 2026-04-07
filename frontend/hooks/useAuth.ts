import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
    return useAuthStore();
}

/**
 * Routes protection logic to prevent login loops and unauthorized access.
 */
export function useProtectedRoutes() {
    const { user, isInitialized } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        // 1. Agar auth initialize nahi hua toh koi move mat karo
        if (!isInitialized) return;

        // Check current location
        const inAuthGroup = segments[0] === "(auth)";
        const isLandingPage = segments.length === 0 || segments[0] === "index";

        // CASE A: User logged in nahi hai
        if (!user) {
            // Agar wo dashboard ya kisi aur protected jagah jane ki koshish kare
            if (!inAuthGroup && !isLandingPage) {
                console.log("Redirecting to Login: No User found");
                router.replace("/(auth)/login");
            }
        } 
        
        // CASE B: User logged in HAI
        else {
            // Agar user logged in hai aur login/signup screens par bhatak raha hai
            if (inAuthGroup || isLandingPage) {
                console.log("Redirecting to Dashboard: User is logged in");
                router.replace("/(dashboard)");
            }
            
            // Note: Dashboard ke andar (Gallery/Settings) ab ye logic interrupt nahi karegi
        }

    }, [user, segments, isInitialized]);
}
