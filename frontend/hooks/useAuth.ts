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
        // Jab tak initialize na ho, kuch mat karo
        if (!isInitialized) return;

        // Path check karne ka sab se pakka tareeqa
        const path = segments.join('/');
        const inAuthGroup = path.includes('(auth)') || path.includes('login') || path.includes('signup');
        
        // Debugging ke liye (Optional: Browser console mein nazar aayega)
        console.log("Current Path:", path, "User:", !!user);

        if (!user) {
            // Agar user nahi hai aur wo dashboard ke kisi bhi hisse mein hai
            // Hum check karte hain ke agar path empty nahi hai aur auth mein nahi hai
            if (!inAuthGroup && path !== "" && path !== "index") {
                router.replace("/(auth)/login");
            }
        } else {
            // Agar user AA GAYA hai aur wo login/auth pages par hai
            if (inAuthGroup || path === "" || path === "index") {
                // Thora sa wait taake state stable ho jaye
                setTimeout(() => {
                    router.replace("/(dashboard)");
                }, 100);
            }
        }
    }, [user, segments, isInitialized]);
}
