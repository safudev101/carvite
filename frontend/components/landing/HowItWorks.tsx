import React, { useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Platform,
    Dimensions,
}

    from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { Colors } from "../../constants/colors";

const { width } = Dimensions.get("window");
const isWide = width > 900;

const STEPS = [
    {
        number: "01",
        icon: "cloud-upload-outline" as const,
        title: "Upload Your Photos",
        desc: "Drag and drop or select multiple vehicle photos from your device. We accept JPEG, PNG, and WebP files up to 25MB each.",
        color: Colors.gold,
    },
    {
        number: "02",
        icon: "color-wand-outline" as const,
        title: "Choose a Backdrop",
        desc: "Select from our curated library of showroom, outdoor, and studio backgrounds — or upload your own dealership-branded backdrop.",
        color: "#60A5FA",
    },
    {
        number: "03",
        icon: "sparkles-outline" as const,
        title: "AI Processes Images",
        desc: "Our rembg-powered AI removes the original background with precision, then composites your chosen backdrop seamlessly.",
        color: "#A78BFA",
    },
    {
        number: "04",
        icon: "download-outline" as const,
        title: "Download & Publish",
        desc: "Preview results with our before/after slider, then download in full resolution — listing-ready in under 10 seconds total.",
        color: "#34D399",
    },
];

export default function HowItWorks() {
    const { isDark } = useTheme();

    const animations = STEPS.map(() => ({
        opacity: useRef(new Animated.Value(0)).current,
        translateX: useRef(new Animated.Value(-30)).current,
    }));

    useEffect(() => {
        Animated.stagger(
            180,
            animations.map(({ opacity, translateX }) =>
                Animated.parallel([
                    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(translateX, { toValue: 0, duration: 500, useNativeDriver: true }),
                ])
            )
        ).start();
    }, []);

    const bg = isDark ? Colors.carbon950 : Colors.light.background;
    const cardBg = isDark ? Colors.carbon800 : Colors.light.surface;
    const border = isDark ? Colors.carbon600 : Colors.light.border;
    const text = isDark ? Colors.dark.text : Colors.light.text;
    const sub = isDark ? Colors.dark.textSecondary : Colors.light.textSecondary;

    return (
        <View id="how-it-works" style={[styles.section, { backgroundColor: bg }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.eyebrow}>HOW IT WORKS</Text>
                <Text style={[styles.title, { color: text }]}>
                    From raw photo to{" "}
                    <Text style={{ color: Colors.gold, fontStyle: "italic" }}>published listing</Text>
                    {"\n"}in four steps
                </Text>
            </View>

            {/* Steps */}
            <View style={[styles.steps, isWide && styles.stepsWide]}>
                {STEPS.map((step, i) => (
                    <Animated.View
                        key={step.number}
                        style={[
                            styles.step,
                            {
                                backgroundColor: cardBg,
                                borderColor: border,
                                opacity: animations[i].opacity,
                                transform: [{ translateX: animations[i].translateX }],
                            },
                        ]}
                    >
                        {/* Step number */}
                        <Text style={[styles.stepNumber, { color: `${step.color}30` }]}>
                            {step.number}
                        </Text>

                        {/* Icon */}
                        <View style={[styles.iconBg, { backgroundColor: `${step.color}18` }]}>
                            <Ionicons name={step.icon} size={26} color={step.color} />
                        </View>

                        <Text style={[styles.stepTitle, { color: text }]}>{step.title}</Text>
                        <Text style={[styles.stepDesc, { color: sub }]}>{step.desc}</Text>

                        {/* Connector line (not on last) */}
                        {i < STEPS.length - 1 && isWide && (
                            <View style={[styles.connector, { backgroundColor: border }]} />
                        )}
                    </Animated.View>
                ))}
            </View>

            {/* Bottom note */}
            <View style={styles.note}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.gold} />
                <Text style={[styles.noteText, { color: sub }]}>
                    Your images are processed securely and stored privately. We never use your photos for
                    training.
                </Text>
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
        maxWidth: 640,
        alignSelf: "center",
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
        fontSize: isWide ? 44 : 30,
        fontWeight: "800",
        lineHeight: isWide ? 52 : 38,
        letterSpacing: -1,
        textAlign: "center",
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    steps: {
        flexDirection: "column",
        gap: 20,
        maxWidth: 1200,
        alignSelf: "center",
        width: "100%",
    },
    stepsWide: {
        flexDirection: "row",
        alignItems: "stretch",
    },
    step: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        padding: 28,
        gap: 12,
        position: "relative",
        overflow: "hidden",
    },
    stepNumber: {
        position: "absolute",
        top: 16,
        right: 20,
        fontSize: 64,
        fontWeight: "900",
        letterSpacing: -2,
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    iconBg: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    stepTitle: {
        fontSize: 19,
        fontWeight: "700",
        letterSpacing: -0.3,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    stepDesc: {
        fontSize: 14,
        lineHeight: 22,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    connector: {
        position: "absolute",
        right: -10,
        top: "50%",
        width: 20,
        height: 1,
        zIndex: 10,
    },
    note: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 48,
        alignSelf: "center",
        maxWidth: 540,
    },
    noteText: {
        fontSize: 13,
        lineHeight: 20,
        textAlign: "center",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
        flex: 1,
    },
});