import { Stack } from "expo-router";
import { useThemeStore } from "../../stores/themeStore";
import { Colors } from "../../constants/colors";

export default function AuthLayout() {
    const { resolvedTheme } = useThemeStore();
    const isDark = resolvedTheme === "dark";
    const bg = isDark ? Colors.carbon950 : Colors.light.background;

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: bg },
                animation: "slide_from_right",
            }}
        />
    );
}