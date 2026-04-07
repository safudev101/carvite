import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import { useProtectedRoutes } from "../hooks/useAuth";
import { Colors } from "../constants/colors";
import "../global.css";

export default function RootLayout() {
    const { initialize } = useAuthStore();
    const { resolvedTheme } = useThemeStore();

    const isDark = resolvedTheme === "dark";

    // 1. Initialize auth state on app launch
    useEffect(() => {
        initialize().catch(err => console.error("Auth Init Error:", err));
    }, []);

    // 2. Set up route protection (Isay humne useAuth.ts mein fix kiya hai)
    useProtectedRoutes();

    const bg = isDark ? Colors.carbon950 : Colors.light.background;

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: bg }}>
            <SafeAreaProvider>
                <StatusBar style={isDark ? "light" : "dark"} />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: bg },
                        animation: "fade", // Faster transition to avoid white flash
                    }}
                >
                    {/* Routes define karna zaroori hai taake navigation stack confuse na ho */}
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
                    <Stack.Screen name="(dashboard)" options={{ gestureEnabled: false }} />
                    <Stack.Screen name="(admin)" />
                </Stack>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
