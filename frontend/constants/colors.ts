export const Colors = {
    // Brand
    gold: "#C9A84C",
    goldLight: "#E0C97A",
    goldDark: "#A8862C",
    goldGlow: "rgba(201, 168, 76, 0.2)",

    // Carbon scale
    carbon950: "#0A0A0B",
    carbon900: "#111113",
    carbon800: "#1A1A1E",
    carbon700: "#242429",
    carbon600: "#2E2E35",
    carbon500: "#3D3D46",

    // Silver scale
    silver100: "#EEF1F4",
    silver200: "#CDD3DA",
    silver300: "#A8B2BE",
    silver400: "#7E8B98",
    silver500: "#5A6472",

    // Semantic Light
    light: {
        background: "#FAFAFA",
        surface: "#FFFFFF",
        surfaceAlt: "#F4F5F7",
        border: "#E4E7EB",
        borderStrong: "#C1C8D0",
        text: "#111113",
        textSecondary: "#5A6472",
        textMuted: "#A8B2BE",
    },

    // Semantic Dark
    dark: {
        background: "#0A0A0B",
        surface: "#111113",
        surfaceAlt: "#1A1A1E",
        border: "#2E2E35",
        borderStrong: "#3D3D46",
        text: "#F0F2F5",
        textSecondary: "#A8B2BE",
        textMuted: "#5A6472",
    },

    // Status
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
} as const;

export const Gradients = {
    goldShimmer:
        "linear-gradient(90deg, #C9A84C 0%, #FDF8EC 50%, #C9A84C 100%)",
    darkHero:
        "linear-gradient(135deg, #0A0A0B 0%, #1A1A1E 50%, #0A0A0B 100%)",
    cardGlow:
        "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0) 60%)",
    surfaceDark:
        "linear-gradient(180deg, #111113 0%, #0A0A0B 100%)",
} as const;