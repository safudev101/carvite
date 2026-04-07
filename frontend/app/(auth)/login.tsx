import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../stores/authStore";
import { useTheme } from "../../hooks/useTheme";
import { Colors } from "../../constants/colors";

const { width, height } = Dimensions.get("window");
const isWide = width > 900;

export default function LoginScreen() {
    const router = useRouter();
    const { signIn, isLoading } = useAuthStore();
    const { isDark, toggleTheme } = useTheme();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Animations
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardY = useRef(new Animated.Value(30)).current;
    const logoScale = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        Animated.stagger(100, [
            Animated.spring(logoScale, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
            Animated.parallel([
                Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(cardY, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        setError("");
        const { error: authError } = await signIn(email.trim(), password);
        if (authError) {
            setError(authError);
        } else {
            router.replace("/(dashboard)");
        }
    };

    // Colors
    const bg = isDark ? Colors.carbon950 : "#F4F5F7";
    const cardBg = isDark ? Colors.carbon800 : Colors.light.surface;
    const border = isDark ? Colors.carbon600 : Colors.light.border;
    const textColor = isDark ? Colors.dark.text : Colors.light.text;
    const subColor = isDark ? Colors.dark.textSecondary : Colors.light.textSecondary;
    const inputBg = isDark ? Colors.carbon700 : Colors.light.surfaceAlt;

    const getInputBorder = (focused: boolean) =>
        focused ? Colors.gold : border;

    return (
        <View style={[styles.root, { backgroundColor: bg }]}>
            {/* Left panel (wide screens only) */}
            {isWide && (
                <View style={styles.leftPanel}>
                    <Image
                        source={{
                            uri: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=900&q=80",
                        }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={["rgba(10,10,11,0.3)", "rgba(10,10,11,0.85)"]}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.leftContent}>
                        <View style={styles.leftLogo}>
                            <View style={styles.logoMark}>
                                <Text style={styles.logoMarkText}>AV</Text>
                            </View>
                            <View>
                                <Text style={styles.logoName}>CARVITE</Text>
                                <Text style={styles.logoTag}>STUDIO</Text>
                            </View>
                        </View>
                        <View style={styles.leftBottom}>
                            <Text style={styles.leftQuote}>
                                "We cut our photo editing time from 2 days to 20 minutes. CarVite Studio is
                                indispensable."
                            </Text>
                            <Text style={styles.leftAuthor}>— Head of Digital, Premier Motors Group</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Right panel — login form */}
            <KeyboardAvoidingView
                style={styles.rightPanel}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Mobile logo */}
                    {!isWide && (
                        <Animated.View
                            style={[styles.mobileLogo, { transform: [{ scale: logoScale }] }]}
                        >
                            <TouchableOpacity onPress={() => router.push("/")} activeOpacity={0.8}>
                                <View style={styles.mobileLogoMark}>
                                    <Text style={styles.mobileLogoText}>AV</Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Form card */}
                    <Animated.View
                        style={[
                            styles.card,
                            {
                                backgroundColor: cardBg,
                                borderColor: border,
                                opacity: cardOpacity,
                                transform: [{ translateY: cardY }],
                            },
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: textColor }]}>Welcome back</Text>
                            <Text style={[styles.cardSub, { color: subColor }]}>
                                Sign in to your CarVite Studio account
                            </Text>
                        </View>

                        {/* Error */}
                        {error ? (
                            <View style={styles.errorBanner}>
                                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Email field */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: subColor }]}>Email Address</Text>
                            <View
                                style={[
                                    styles.inputWrap,
                                    {
                                        backgroundColor: inputBg,
                                        borderColor: getInputBorder(emailFocused),
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="mail-outline"
                                    size={18}
                                    color={emailFocused ? Colors.gold : (isDark ? Colors.silver400 : Colors.silver400)}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    placeholder="you@dealership.com"
                                    placeholderTextColor={isDark ? Colors.silver500 : Colors.silver300}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        {/* Password field */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: subColor }]}>Password</Text>
                                <TouchableOpacity activeOpacity={0.7}>
                                    <Text style={styles.forgotLink}>Forgot password?</Text>
                                </TouchableOpacity>
                            </View>
                            <View
                                style={[
                                    styles.inputWrap,
                                    {
                                        backgroundColor: inputBg,
                                        borderColor: getInputBorder(passwordFocused),
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={18}
                                    color={passwordFocused ? Colors.gold : (isDark ? Colors.silver400 : Colors.silver400)}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    placeholder="••••••••"
                                    placeholderTextColor={isDark ? Colors.silver500 : Colors.silver300}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeBtn}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={18}
                                        color={isDark ? Colors.silver400 : Colors.silver400}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.85}
                        >
                            {isLoading ? (
                                <Text style={styles.submitText}>Signing in...</Text>
                            ) : (
                                <>
                                    <Text style={styles.submitText}>Sign In</Text>
                                    <Ionicons name="arrow-forward" size={18} color={Colors.carbon950} />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={[styles.dividerLine, { backgroundColor: border }]} />
                            <Text style={[styles.dividerText, { color: subColor }]}>or</Text>
                            <View style={[styles.dividerLine, { backgroundColor: border }]} />
                        </View>

                        {/* Sign up link */}
                        <View style={styles.signupRow}>
                            <Text style={[styles.signupText, { color: subColor }]}>
                                Don't have an account?
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/(auth)/signup")}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.signupLink}> Create one free</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Theme toggle */}
                    <TouchableOpacity style={styles.themeBtn} onPress={toggleTheme} activeOpacity={0.7}>
                        <Ionicons
                            name={isDark ? "sunny-outline" : "moon-outline"}
                            size={18}
                            color={subColor}
                        />
                        <Text style={[styles.themeBtnText, { color: subColor }]}>
                            Switch to {isDark ? "Light" : "Dark"} mode
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        flexDirection: isWide ? "row" : "column",
    },
    leftPanel: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
    },
    leftContent: {
        flex: 1,
        padding: 48,
        justifyContent: "space-between",
    },
    leftLogo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    logoMark: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: Colors.gold,
        alignItems: "center",
        justifyContent: "center",
    },
    logoMarkText: {
        color: Colors.carbon950,
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 1,
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    logoName: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    logoTag: {
        color: Colors.gold,
        fontSize: 9,
        letterSpacing: 4,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    leftBottom: { maxWidth: 420 },
    leftQuote: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 22,
        lineHeight: 32,
        fontStyle: "italic",
        fontWeight: "500",
        marginBottom: 16,
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    leftAuthor: {
        color: Colors.gold,
        fontSize: 13,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },

    rightPanel: {
        flex: isWide ? undefined : 1,
        width: isWide ? 480 : "100%",
    },
    scroll: {
        flexGrow: 1,
        justifyContent: "center",
        padding: isWide ? 48 : 24,
    },
    mobileLogo: {
        alignItems: "center",
        marginBottom: 32,
    },
    mobileLogoMark: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: Colors.gold,
        alignItems: "center",
        justifyContent: "center",
    },
    mobileLogoText: {
        color: Colors.carbon950,
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: 1,
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 32,
        gap: 20,
    },
    cardHeader: { gap: 6 },
    cardTitle: {
        fontSize: 26,
        fontWeight: "800",
        letterSpacing: -0.5,
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    cardSub: {
        fontSize: 14,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    errorBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: `${Colors.error}18`,
        borderWidth: 1,
        borderColor: `${Colors.error}40`,
        borderRadius: 10,
        padding: 12,
    },
    errorText: {
        color: Colors.error,
        fontSize: 13,
        flex: 1,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    fieldGroup: { gap: 8 },
    labelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0.2,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    forgotLink: {
        fontSize: 13,
        color: Colors.gold,
        fontWeight: "600",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderRadius: 11,
        height: 50,
        paddingHorizontal: 14,
        gap: 10,
        transitionProperty: "border-color",
        transitionDuration: "200ms",
    } as any,
    inputIcon: {},
    input: {
        flex: 1,
        fontSize: 15,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
        outlineStyle: "none" as any,
    },
    eyeBtn: { padding: 4 },
    submitBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: Colors.gold,
        borderRadius: 11,
        height: 52,
        marginTop: 4,
    },
    submitText: {
        color: Colors.carbon950,
        fontSize: 16,
        fontWeight: "800",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
    },
    dividerText: {
        fontSize: 13,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    signupRow: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
    },
    signupText: {
        fontSize: 14,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    signupLink: {
        fontSize: 14,
        color: Colors.gold,
        fontWeight: "700",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    themeBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 24,
        paddingVertical: 12,
    },
    themeBtnText: {
        fontSize: 13,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
});