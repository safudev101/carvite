import React, { useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Platform,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { Colors } from "../../constants/colors";

const { width } = Dimensions.get("window");
const isWide = width > 900;
const isMobileUI = screenWidth < 768; // Mobile check

const FEATURES = [
    {
        icon: "flash" as const,
        color: Colors.gold,
        title: "Instant AI Removal",
        desc: "State-of-the-art rembg model removes backgrounds with surgical precision — wheels, reflections, and curved bodywork included.",
    },
    {
        icon: "images" as const,
        color: "#60A5FA",
        title: "Bulk Processing",
        desc: "Upload entire shoot folders at once. Process dozens of vehicle images simultaneously with a single click.",
    },
    {
        icon: "color-palette" as const,
        color: "#A78BFA",
        title: "Studio Backdrops",
        desc: "Choose from 50+ premium showroom, outdoor, and gradient backgrounds — or upload your branded dealership backdrop.",
    },
    {
        icon: "eye" as const,
        color: "#34D399",
        title: "Before / After Preview",
        desc: "Interactive drag slider reveals the transformation in real time. Share previews with clients before downloading.",
    },
    {
        icon: "cloud-upload" as const,
        color: "#FB923C",
        title: "Cloud Gallery",
        desc: "All processed images are stored securely in your personal Supabase gallery — accessible from any device.",
    },
    {
        icon: "download" as const,
        color: "#F472B6",
        title: "Export Ready",
        desc: "Download in WebP, JPEG, or PNG at full resolution. Batch-download entire sessions as a ZIP archive.",
    },
];

function FeatureCard({
    feature,
    index,
    isDark,
}: {
    /*feature: (typeof FEATURES)[0];*/
    { feature: any,
    index: number;
    isDark: boolean;
}) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 500,
                delay: index * 100 + 200,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                delay: index * 100 + 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const bg = isDark ? Colors.carbon800 : Colors.light.surface;
    const border = isDark ? Colors.carbon600 : Colors.light.border;

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    backgroundColor: bg,
                    borderColor: border,
                    opacity,
                    transform: [{ translateY }],
                    // Mobile par card ki width control karo
                    width: isMobileUI ? '100%' : (isWide ? 340 : '100%')
                },
            ]}
        >
            {/* Icon container */}
            <View style={[styles.iconWrap, { backgroundColor: `${feature.color}18` }]}>
                <Ionicons name={feature.icon} size={24} color={feature.color} />
            </View>

            <Text style={[styles.cardTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
                {feature.title}
            </Text>
            <Text style={[styles.cardDesc, { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }]}>
                {feature.desc}
            </Text>

            {/* Bottom accent line */}
            <View style={[styles.accentLine, { backgroundColor: feature.color }]} />
        </Animated.View>
    );
}

export default function FeaturesSection() {
    const { isDark } = useTheme();

    return (
        <View
            id="features"
            style={[
                styles.section,
                { backgroundColor: isDark ? Colors.carbon900 : Colors.light.surfaceAlt },
                isMobileUI && { paddingVertical: 60, paddingHorizontal: 16 } // Mobile padding
            ]}
        >
            {/* Section header */}
            <View style={[styles.header, isMobileUI && { marginBottom: 40 }]}>
                <Text style={styles.eyebrow}>CAPABILITIES</Text>
                <Text
                    style={[
                        styles.title,
                        { color: isDark ? Colors.dark.text : Colors.light.text }, 
                        isMobileUI && { fontSize: 26, lineHeight: 34 } // Mobile font fix
                    ]}
                >
                    Everything a dealership {isMobileUI ? : "\n"}
                    <Text style={{ color: Colors.gold, fontStyle: "italic" }}>needs to sell faster</Text>
                </Text>
                <Text
                    style={[
                        styles.subtitle,
                        { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }, 
                        isMobileUI && { fontSize: 14 }
                    ]}
                >
                    One platform, from raw photo to listing-ready image.
                </Text>
            </View>

            {/* Feature grid */}
            <View style={[styles.grid, isWide && styles.gridWide, 
                // Mobile par cards ke beech gap set karo
                isMobileUI && { gap: 16 }]}>
                {FEATURES.map((feature, i) => (
                    <FeatureCard key={feature.title} feature={feature} index={i} isDark={isDark} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingVertical: 96,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: "center",
        marginBottom: 64,
        maxWidth: 600,
        alignSelf: "center",
        width: 100%,
    },
    eyebrow: {
        color: Colors.gold,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 4,
        marginBottom: 16,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    title: {
        fontSize: isWide ? 44 : 32,
        fontWeight: "800",
        lineHeight: isWide ? 52 : 40,
        letterSpacing: -1,
        textAlign: "center",
        marginBottom: 16,
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: "center",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    grid: {
        flexDirection: "column",
        gap: 20,
        maxWidth: 1200,
        alignSelf: "center",
        width: "100%",
    },
    gridWide: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 24,
        gap: 12,
        position: "relative",
        overflow: "hidden",
        ...(Platform.OS === "web" && {
            flex: "1 1 300px" as any,
            maxWidth: 360,
        }),
    },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: -0.3,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    cardDesc: {
        fontSize: 14,
        lineHeight: 22,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    accentLine: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        opacity: 0.6,
    },
});
