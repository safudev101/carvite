import React, { useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    ImageBackground,
    Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";
import { Colors } from "../../constants/colors";

const { width, height } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isWide = width > 900;
const isMobileUI = screenWidth < 768;

export default function HeroSection() {
    const router = useRouter();
    const { isDark } = useTheme();

    // Animation refs
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const taglineY = useRef(new Animated.Value(30)).current;
    const headlineOpacity = useRef(new Animated.Value(0)).current;
    const headlineY = useRef(new Animated.Value(40)).current;
    const subOpacity = useRef(new Animated.Value(0)).current;
    const subY = useRef(new Animated.Value(30)).current;
    const ctaOpacity = useRef(new Animated.Value(0)).current;
    const ctaY = useRef(new Animated.Value(20)).current;
    const statsOpacity = useRef(new Animated.Value(0)).current;
    const imageScale = useRef(new Animated.Value(1.05)).current;
    const imageOpacity = useRef(new Animated.Value(0)).current;
    const glowPulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const seq = Animated.stagger(140, [
            Animated.parallel([
                Animated.timing(imageOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(imageScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(taglineY, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(headlineOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(headlineY, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(subOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(subY, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(ctaOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(ctaY, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]),
            Animated.timing(statsOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]);

        seq.start();

        // Gold glow pulse loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(glowPulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const glowOpacity = glowPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.15, 0.45],
    });

    const stats = [
        { value: "50K+", label: "Images Processed" },
        { value: "2,400+", label: "Dealerships" },
        { value: "99.2%", label: "Accuracy Rate" },
        { value: "<3s", label: "Per Image" },
    ];

    return (
        <View style={[styles.container, {
            backgroundColor: isDark ? Colors.carbon950 : "#F8F9FB" }, 
            minHeight: isWeb ? "90vh" : isMobileUI ? screenHeight * 0.95 : screenHeight * 0.88 }]}>
            {/* Background image with gradient overlay */}
            <Animated.View
                style={[styles.bgImage, { opacity: imageOpacity, transform: [{ scale: imageScale }] }]}
            >
                <Image
                    source={{
                        uri: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600&q=80",
                    }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
            </Animated.View>

            {/* Gradient overlay */}
            <LinearGradient
                colors={
                    isDark
                        ? ["rgba(10,10,11,0.85)", "rgba(10,10,11,0.6)", "rgba(10,10,11,0.95)"]
                        : ["rgba(248,249,251,0.82)", "rgba(248,249,251,0.55)", "rgba(248,249,251,0.95)"]
                }
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Grid dots pattern */}
            {isWeb && (
                <View style={styles.dotsPattern} pointerEvents="none" />
            )}

            {/* Gold glow orb */}
            <Animated.View
                style={[styles.glowOrb, { opacity: glowOpacity }]}
                pointerEvents="none"
            />

            {/* Main content */}
            <View style={[styles.content, isWide && styles.contentWide, isMobileUI && { paddingTop: 60, paddingHorizontal: 20 }]}>
                {/* Tagline badge */}
                <Animated.View
                    style={[
                        styles.taglineBadge,
                        { opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
                        isMobileUI && { alignSelf: 'center', marginBottom: 16 }
                    ]}
                >
                    <View style={styles.taglineDot} />
                    <Text style={[styles.taglineText, isMobileUI && { fontSize: 10 }]}>AI-Powered Automotive Imaging</Text>
                </Animated.View>

                {/* Main headline */}
                <Animated.View
                    style={{ opacity: headlineOpacity, transform: [{ translateY: headlineY }] }}
                >
                    <Text
                        style={[
                            styles.headline,
                            { color: isDark ? "#F0F2F5" : Colors.carbon900 },
                        ]}
                    >
                        {"Studio-Grade\nCar Photos.\n"}
                        <Text style={styles.headlineAccent}>Instantly.</Text>
                    </Text>
                </Animated.View>

                {/* Sub-headline */}
                <Animated.Text
                    style={[
                        styles.sub,
                        {
                            color: isDark ? Colors.silver300 : Colors.silver500,
                            opacity: subOpacity,
                            transform: [{ translateY: subY }],
                        },
                    ]}
                >
                    Upload your vehicle photos, let our AI remove the background, apply
                    premium showroom backdrops, and deliver pixel-perfect images ready
                    for listings — in under 3 seconds each.
                </Animated.Text>

                {/* CTA Buttons */}
                <Animated.View
                    style={[
                        styles.ctaRow,
                        { opacity: ctaOpacity, transform: [{ translateY: ctaY }] },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.ctaPrimary}
                        onPress={() => router.push("/(auth)/signup")}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.ctaPrimaryText}>Start for Free</Text>
                        <Ionicons name="arrow-forward" size={18} color={Colors.carbon950} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.ctaSecondary,
                            {
                                borderColor: isDark ? Colors.carbon600 : Colors.light.border,
                                backgroundColor: isDark ? `${Colors.carbon800}80` : `${Colors.light.surface}80`,
                            },
                        ]}
                        onPress={() => { }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="play-circle-outline" size={20} color={Colors.gold} />
                        <Text style={[styles.ctaSecondaryText, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
                            Watch Demo
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Trust indicators */}
                <Animated.View style={[styles.trustRow, { opacity: ctaOpacity }]}>
                    {["No credit card required", "Free 50 images/month", "Cancel anytime"].map(
                        (item) => (
                            <View key={item} style={styles.trustItem}>
                                <Ionicons name="checkmark-circle" size={14} color={Colors.gold} />
                                <Text style={[styles.trustText, { color: isDark ? Colors.silver300 : Colors.silver500 }]}>
                                    {item}
                                </Text>
                            </View>
                        )
                    )}
                </Animated.View>
            </View>

            {/* Stats bar */}
            <Animated.View
                style={[
                    styles.statsBar,
                    {
                        opacity: statsOpacity,
                        backgroundColor: isDark
                            ? `${Colors.carbon800}CC`
                            : `${Colors.light.surface}CC`,
                        borderTopColor: isDark ? Colors.carbon600 : Colors.light.border,
                    },
                ]}
            >
                {stats.map((stat, i) => (
                    <View
                        key={stat.label}
                        style={[
                            styles.statItem,
                            i < stats.length - 1 && {
                                borderRightWidth: StyleSheet.hairlineWidth,
                                borderRightColor: isDark ? Colors.carbon600 : Colors.light.border,
                            },
                        ]}
                    >
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text
                            style={[
                                styles.statLabel,
                                { color: isDark ? Colors.silver400 : Colors.silver500 },
                            ]}
                        >
                            {stat.label}
                        </Text>
                    </View>
                ))}
            </Animated.View>
        </View>
    );
}

const styles = (StyleSheet.create as any)({
    container: {
        minHeight: isWeb ? "90vh" as any : height * 0.88,
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
    },
    bgImage: {
        ...StyleSheet.absoluteFillObject,
    },
    dotsPattern: {
        ...StyleSheet.absoluteFillObject,
        backgroundImage:
            "radial-gradient(circle, rgba(201,168,76,0.07) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
    } as any,
    glowOrb: {
        position: "absolute",
        width: 600,
        height: 600,
        borderRadius: 300,
        backgroundColor: Colors.gold,
        top: "20%",
        right: -200,
        ...(Platform.OS === "web" && { filter: "blur(120px)" } as any),
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
        maxWidth: 680,
        zIndex: 2,
    },
    contentWide: {
        paddingHorizontal: 80,
        paddingTop: 120,
    },
    taglineBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: `${Colors.gold}50`,
        backgroundColor: `${Colors.gold}12`,
        marginBottom: 24,
    },
    taglineDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: Colors.gold,
    },
    taglineText: {
        color: Colors.gold,
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    headline: {
        fontSize: isWeb ? (isWide ? 68 : 48) : 38,
        fontWeight: "900",
        lineHeight: isWeb ? (isWide ? 76 : 56) : 46,
        letterSpacing: -1.5,
        marginBottom: 20,
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    headlineAccent: {
        color: Colors.gold,
        fontStyle: "italic",
    },
    sub: {
        fontSize: isWeb ? 18 : 15,
        lineHeight: isWeb ? 28 : 24,
        fontWeight: "400",
        marginBottom: 36,
        maxWidth: 520,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    ctaRow: {
        flexDirection: "row",
        gap: 14,
        marginBottom: 24,
        flexWrap: "wrap",
    },
    ctaPrimary: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 28,
        paddingVertical: 16,
        backgroundColor: Colors.gold,
        borderRadius: 12,
    },
    ctaPrimaryText: {
        color: Colors.carbon950,
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 0.2,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    ctaSecondary: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    ctaSecondaryText: {
        fontSize: 16,
        fontWeight: "600",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    trustRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 20,
    },
    trustItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    trustText: {
        fontSize: 13,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    statsBar: {
        flexDirection: "row",
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingVertical: 20,
        backdropFilter: "blur(16px)",
    } as any,
    statItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 4,
    },
    statValue: {
        fontSize: isWeb ? 26 : 22,
        fontWeight: "800",
        color: Colors.gold,
        letterSpacing: -0.5,
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    statLabel: {
        fontSize: 11,
        letterSpacing: 0.5,
        marginTop: 2,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
});
