import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    Animated,
    StyleSheet,
    Dimensions,
    Platform,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Colors } from "../../constants/colors";

const { width, height } = Dimensions.get("window");

interface LoadingScreenProps {
    message?: string;
    showLogo?: boolean;
}

export default function LoadingScreen({
    message = "Loading...",
    showLogo = true,
}: LoadingScreenProps) {
    const { isDark } = useTheme();

    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.85)).current;
    const lineWidth = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const shimmerX = useRef(new Animated.Value(-width)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 80,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(lineWidth, {
                    toValue: 120,
                    duration: 500,
                    useNativeDriver: false,
                }),
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Shimmer loop
        Animated.loop(
            Animated.timing(shimmerX, {
                toValue: width,
                duration: 1800,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: isDark ? Colors.carbon950 : "#FAFAFA" },
            ]}
        >
            {/* Background grid pattern */}
            <View style={styles.gridOverlay} pointerEvents="none" />

            {/* Center content */}
            <Animated.View
                style={[
                    styles.content,
                    { opacity: logoOpacity, transform: [{ scale: logoScale }] },
                ]}
            >
                {/* Logo mark */}
                <View style={styles.logoMark}>
                    <View style={styles.logoRing}>
                        <View style={styles.logoInner} />
                        {/* Shimmer sweep */}
                        <Animated.View
                            style={[
                                styles.shimmer,
                                { transform: [{ translateX: shimmerX }] },
                            ]}
                        />
                    </View>
                    {/* A stylized "AV" monogram */}
                    <Text style={styles.logoText}>AV</Text>
                </View>

                {/* Brand name */}
                <Text
                    style={[
                        styles.brandName,
                        { color: isDark ? "#F0F2F5" : Colors.carbon900 },
                    ]}
                >
                    AutoVisio
                </Text>
                <Text style={styles.brandSub}>STUDIO</Text>

                {/* Gold line */}
                <Animated.View style={[styles.line, { width: lineWidth }]} />

                {/* Loading message */}
                <Animated.Text
                    style={[
                        styles.message,
                        {
                            opacity: textOpacity,
                            color: isDark ? Colors.silver300 : Colors.silver500,
                        },
                    ]}
                >
                    {message}
                </Animated.Text>
            </Animated.View>

            {/* Bottom bar */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Powered by AI · Precision Imaging</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.04,
        // Grid done via CSS on web, transparent on native
        backgroundColor: "transparent",
    },
    content: {
        alignItems: "center",
        gap: 12,
    },
    logoMark: {
        width: 80,
        height: 80,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    logoRing: {
        position: "absolute",
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1.5,
        borderColor: Colors.gold,
        overflow: "hidden",
    },
    logoInner: {
        position: "absolute",
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: `${Colors.gold}40`,
        top: 11,
        left: 11,
    },
    shimmer: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 40,
        backgroundColor: `${Colors.gold}30`,
        transform: [{ skewX: "-20deg" }],
    },
    logoText: {
        fontFamily: Platform.select({ ios: "Georgia", android: "serif", web: "Playfair Display" }),
        fontSize: 22,
        fontWeight: "700",
        color: Colors.gold,
        letterSpacing: 2,
    },
    brandName: {
        fontFamily: Platform.select({ ios: "Georgia", android: "serif", web: "Playfair Display" }),
        fontSize: 28,
        fontWeight: "700",
        letterSpacing: 3,
        marginTop: 8,
    },
    brandSub: {
        fontFamily: Platform.select({ ios: "AvenirNext-Medium", android: "sans-serif-medium", web: "DM Sans" }),
        fontSize: 11,
        letterSpacing: 8,
        color: Colors.gold,
        marginTop: -4,
    },
    line: {
        height: 1,
        backgroundColor: Colors.gold,
        marginVertical: 16,
        opacity: 0.6,
    },
    message: {
        fontFamily: Platform.select({ ios: "AvenirNext-Regular", android: "sans-serif", web: "DM Sans" }),
        fontSize: 13,
        letterSpacing: 0.5,
    },
    footer: {
        position: "absolute",
        bottom: 40,
    },
    footerText: {
        color: Colors.silver400,
        fontSize: 11,
        letterSpacing: 1,
        fontFamily: Platform.select({ ios: "AvenirNext-Regular", android: "sans-serif", web: "DM Sans" }),
    },
});