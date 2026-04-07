import { useThemeStore } from "@/stores/themeStore";
import { Colors } from "@/constants/colors";

export function useTheme() {
    const { resolvedTheme, theme, setTheme, toggleTheme } = useThemeStore();
    const isDark = resolvedTheme === "dark";

    const colors = isDark ? Colors.dark : Colors.light;
    const brand = {
        gold: Colors.gold,
        goldLight: Colors.goldLight,
        goldDark: Colors.goldDark,
        goldGlow: Colors.goldGlow,
    };

    return {
        theme,
        resolvedTheme,
        isDark,
        setTheme,
        toggleTheme,
        colors,
        brand,
    };
}