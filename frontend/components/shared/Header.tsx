import React, { useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform,
    Dimensions, // Added missing import
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../stores/authStore";
import { Colors } from "../../constants/colors";

interface HeaderProps {
    transparent?: boolean;
    showNav?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

export default function Header({ transparent = false, showNav = true }: HeaderProps) {
    const { isDark, toggleTheme } = useTheme();
    const { user, signOut } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    const slideY = useRef(new Animated.Value(-60)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideY, { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
        ]).start();
    }, []);

    const bg = transparent
        ? "transparent"
        : isDark
            ? `${Colors.carbon900}EE`
            : `${Colors.light.surface}EE`;

    const borderColor = isDark ? Colors.carbon600 : Colors.light.border;
    const textColor = isDark ? Colors.dark.text : Colors.light.text;

    const navLinks = [
        { label: "Features", href: "/#features" },
        { label: "How It Works", href: "/#how-it-works" },
        { label: "Pricing", href: "/#pricing" },
    ];

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: bg,
                    borderBottomColor: transparent ? "transparent" : borderColor,
                    transform: [{ translateY: slideY }],
                    opacity,
                    paddingHorizontal: isMobile ? 12 : 24,
                },
            ]}
        >
            {/* Logo */}
            <TouchableOpacity
                style={styles.logo}
                onPress={() => router.push("/")}
                activeOpacity={0.8}
            >
                <View style={[styles.logoMark, isMobile && { width: 30, height: 30 }]}>
                    <Text style={[styles.logoMarkText, isMobile && { fontSize: 11 }]}>AV</Text>
                </View>
                <View>
                    <Text style={[styles.logoName, { color: textColor }, isMobile && { fontSize: 13 }]}>AutoVisio</Text>
                    {!isMobile && <Text style={styles.logoTag}>STUDIO</Text>}
                </View>
            </TouchableOpacity>

            {/* Nav Links (web only) */}
            {showNav && Platform.OS === "web" && (
                <View style={styles.navLinks}>
                    {navLinks.map((link) => (
                        <TouchableOpacity key={link.label} style={styles.navLink} activeOpacity={0.7}>
                            <Text style={[styles.navLinkText, { color: isDark ? Colors.silver300 : Colors.silver500 }]}>
                                {link.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Right actions */}
            <View style={[styles.actions, { gap: isMobile ? 8 : 12 }]}>
                {/* Theme toggle */}
                <TouchableOpacity
                    style={[styles.iconBtn, { borderColor }, isMobile && { width: 32, height: 32 }]}
                    onPress={toggleTheme}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isDark ? "sunny-outline" : "moon-outline"}
                        size={isMobile ? 16 : 18}
                        color={isDark ? Colors.silver300 : Colors.silver500}
                    />
                </TouchableOpacity>

                {user ? (
                    <TouchableOpacity
                        style={[styles.dashBtn, isMobile && { paddingHorizontal: 12, paddingVertical: 7 }]}
                        onPress={() => router.push("/(dashboard)")}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.dashBtnText}>Dashboard</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        {!isMobile && (
                            <TouchableOpacity
                                onPress={() => router.push("/(auth)/login")}
                                style={styles.loginBtn}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.loginBtnText, { color: isDark ? Colors.silver300 : Colors.silver500 }]}>
                                    Sign In
                                </Text>
                            </TouchableOpacity> 
                        )}
                        <TouchableOpacity
                            style={[styles.ctaBtn, isMobile && { paddingHorizontal: 12, paddingVertical: 7 }]}
                            onPress={() => router.push("/(auth)/signup")}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.ctaBtnText, isMobile && { fontSize: 12 }]}>
                                {isMobile ? "Start" : "Get Started"}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        zIndex: 100,
        ...(Platform.OS === "web" && {
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
        } as any),
    },
    logo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    logoMark: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: Colors.gold,
        alignItems: "center",
        justifyContent: "center",
    },
    logoMarkText: {
        color: Colors.carbon950,
        fontSize: 13,
        fontWeight: "800",
        letterSpacing: 1,
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    logoName: {
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.5,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    logoTag: {
        fontSize: 8,
        letterSpacing: 4,
        color: Colors.gold,
        marginTop: -2,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    navLinks: {
        flexDirection: "row",
        gap: 32,
    },
    navLink: {},
    navLinkText: {
        fontSize: 14,
        fontWeight: "500",
        letterSpacing: 0.3,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loginBtn: { paddingHorizontal: 8 },
    loginBtnText: {
        fontSize: 14,
        fontWeight: "500",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    ctaBtn: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 8,
        backgroundColor: Colors.gold,
    },
    ctaBtnText: {
        color: Colors.carbon950,
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.3,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    dashBtn: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 8,
        backgroundColor: Colors.gold,
    },
    dashBtnText: {
        color: Colors.carbon950,
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.3,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
});
