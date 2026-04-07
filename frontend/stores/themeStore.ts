import { create } from "zustand";
import { Appearance, ColorSchemeName } from "react-native";

type Theme = "light" | "dark" | "system";

interface ThemeState {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

function getResolved(theme: Theme): "light" | "dark" {
    if (theme === "system") {
        return (Appearance.getColorScheme() as "light" | "dark") ?? "dark";
    }
    return theme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: "dark",
    resolvedTheme: "dark",

    setTheme: (theme) => {
        set({ theme, resolvedTheme: getResolved(theme) });
    },

    toggleTheme: () => {
        const current = get().resolvedTheme;
        const next = current === "dark" ? "light" : "dark";
        set({ theme: next, resolvedTheme: next });
    },
}));

// Sync with OS preference changes
Appearance.addChangeListener(({ colorScheme }) => {
    const store = useThemeStore.getState();
    if (store.theme === "system") {
        store.setTheme("system");
    }
});