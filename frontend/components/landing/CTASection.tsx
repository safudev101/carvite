import React, { useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../constants/colors";

const { width } = Dimensions.get("window");
const isWide = width > 900;

export default function CTASection() {
    const router = useRouter();
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.96)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <View style={styles.section}>
            <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
                <LinearGradient
                    colors={["#1A1A1E", "#111113", "#0A0A0B"]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                {/* Gold glow top */}
                <View style={styles.glowTop} pointerEvents="none" />

                {/* Grid overlay */}
                {Platform.OS === "web" && (
                    <View style={styles.grid} pointerEvents="none" />
                )}

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.eyebrow}>START TODAY — IT'S FREE</Text>
                    <Text style={styles.title}>
                        {"Ready to deliver\n"}
                        <Text style={styles.titleAccent}>showroom-quality</Text>
                        {"\nphotos at scale?"}
                    </Text>
                    <Text style={styles.subtitle}>
                        Join 2,400+ dealerships using CarVite Studio to create professional car listings 10×
                        faster than traditional photography editing.
                    </Text>

                    {/* CTA buttons */}
                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => router.push("/(auth)/signup")}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.primaryBtnText}>Create Free Account</Text>
                            <Ionicons name="arrow-forward" size={18} color={Colors.carbon950} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            onPress={() => router.push("/(auth)/login")}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryBtnText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Features list */}
                    <View style={styles.featureList}>
                        {[
                            "50 free images/month",
                            "No credit card needed",
                            "All backgrounds included",
                            "Cancel anytime",
                        ].map((item) => (
                            <View key={item} style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={16} color={Colors.gold} />
                                <Text style={styles.featureText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingVertical: 96,
        paddingHorizontal: 24,
        backgroundColor: "#0A0A0B",
    },
    card: {
        borderRadius: 24,
        overflow: "hidden",
        maxWidth: 900,
        alignSelf: "center",
        width: "100%",
        borderWidth: 1,
        borderColor: Colors.carbon600,
        position: "relative",
    },
    glowTop: {
        position: "absolute",
        top: -80,
        left: "50%",
        width: 400,
        height: 200,
        borderRadius: 200,
        backgroundColor: Colors.gold,
        opacity: 0.08,
        ...(Platform.OS === "web" && { filter: "blur(60px)", transform: [{ translateX: -200 }] } as any),
    },
    grid: {
        ...StyleSheet.absoluteFillObject,
        backgroundImage:
            "radial-gradient(circle, rgba(201,168,76,0.06) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        opacity: 0.7,
    } as any,
    content: {
        padding: isWide ? 72 : 36,
        alignItems: "center",
        gap: 20,
        zIndex: 2,
    },
    eyebrow: {
        color: Colors.gold,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 4,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    title: {
        fontSize: isWide ? 52 : 36,
        fontWeight: "800",
        color: "#F0F2F5",
        lineHeight: isWide ? 60 : 44,
        letterSpacing: -1.5,
        textAlign: "center",
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    titleAccent: {
        color: Colors.gold,
        fontStyle: "italic",
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 26,
        color: Colors.silver300,
        textAlign: "center",
        maxWidth: 540,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    buttons: {
        flexDirection: "row",
        gap: 16,
        marginTop: 12,
        flexWrap: "wrap",
        justifyContent: "center",
    },
    primaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 32,
        paddingVertical: 17,
        backgroundColor: Colors.gold,
        borderRadius: 12,
    },
    primaryBtnText: {
        color: Colors.carbon950,
        fontSize: 16,
        fontWeight: "800",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    secondaryBtn: {
        paddingHorizontal: 32,
        paddingVertical: 17,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.carbon500,
    },
    secondaryBtnText: {
        color: Colors.silver300,
        fontSize: 16,
        fontWeight: "600",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    featureList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "center",
        marginTop: 8,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
    },
    featureText: {
        color: Colors.silver400,
        fontSize: 13,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
});