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
    const { initialize, isInitialized } = useAuthStore();
    const { resolvedTheme } = useThemeStore();

    const isDark = resolvedTheme === "dark";

    // Initialize auth state on app launch
    useEffect(() => {
        initialize();
    }, []);

    // Set up route protection
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
                        animation: "fade",
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(dashboard)" />
                    <Stack.Screen name="(admin)" />
                </Stack>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}