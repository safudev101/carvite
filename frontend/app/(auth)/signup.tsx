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

const { width } = Dimensions.get("window");
const isWide = width > 900;

const PASSWORD_RULES = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One number", test: (p: string) => /\d/.test(p) },
];

export default function SignupScreen() {
    const router = useRouter();
    const { signUp, isLoading } = useAuthStore();
    const { isDark, toggleTheme } = useTheme();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [focusedField, setFocusedField] = useState<string | null>(null);

    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardY = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(cardOpacity, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
            Animated.timing(cardY, { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
        ]).start();
    }, []);

    const validate = () => {
        if (!fullName.trim()) return "Please enter your full name.";
        if (!email.trim() || !email.includes("@")) return "Please enter a valid email address.";
        if (!PASSWORD_RULES.every((r) => r.test(password))) return "Password does not meet requirements.";
        if (!agreed) return "Please agree to the Terms of Service to continue.";
        return null;
    };

    const handleSignup = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        setError("");

        const { error: authError } = await signUp(email.trim(), password, fullName.trim());
        if (authError) {
            setError(authError);
        } else {
            setSuccess(true);
            // If Supabase requires email confirmation, show success. Otherwise redirect.
            setTimeout(() => router.replace("/(dashboard)"), 2000);
        }
    };

    const passwordStrength = PASSWORD_RULES.filter((r) => r.test(password)).length;
    const strengthColors = ["#EF4444", "#F59E0B", "#22C55E"];
    const strengthLabels = ["Weak", "Fair", "Strong"];

    const bg = isDark ? Colors.carbon950 : "#F4F5F7";
    const cardBg = isDark ? Colors.carbon800 : Colors.light.surface;
    const border = isDark ? Colors.carbon600 : Colors.light.border;
    const textColor = isDark ? Colors.dark.text : Colors.light.text;
    const subColor = isDark ? Colors.dark.textSecondary : Colors.light.textSecondary;
    const inputBg = isDark ? Colors.carbon700 : Colors.light.surfaceAlt;

    const getBorder = (field: string) =>
        focusedField === field ? Colors.gold : border;

    if (success) {
        return (
            <View style={[styles.root, { backgroundColor: bg, justifyContent: "center", alignItems: "center" }]}>
                <View style={styles.successCard}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={48} color={Colors.gold} />
                    </View>
                    <Text style={[styles.successTitle, { color: textColor }]}>Account Created!</Text>
                    <Text style={[styles.successSub, { color: subColor }]}>
                        Redirecting you to the studio...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: bg }]}>
            {/* Left panel (wide screens) */}
            {isWide && (
                <View style={styles.leftPanel}>
                    <Image
                        source={{
                            uri: "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=900&q=80",
                        }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={["rgba(10,10,11,0.3)", "rgba(10,10,11,0.88)"]}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.leftContent}>
                        <TouchableOpacity
                            style={styles.leftLogo}
                            onPress={() => router.push("/")}
                            activeOpacity={0.8}
                        >
                            <View style={styles.logoMark}>
                                <Text style={styles.logoMarkText}>AV</Text>
                            </View>
                            <View>
                                <Text style={styles.logoName}>CarVite</Text>
                                <Text style={styles.logoTag}>STUDIO</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Feature highlights */}
                        <View style={styles.highlights}>
                            <Text style={styles.highlightsTitle}>What you get for free:</Text>
                            {[
                                "50 AI-processed images per month",
                                "8 premium studio backgrounds",
                                "Before/After comparison slider",
                                "Cloud gallery storage",
                                "WebP & JPEG export",
                            ].map((item) => (
                                <View key={item} style={styles.highlightItem}>
                                    <View style={styles.highlightDot} />
                                    <Text style={styles.highlightText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            {/* Right panel — signup form */}
            <KeyboardAvoidingView
                style={styles.rightPanel}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {!isWide && (
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={20} color={subColor} />
                        </TouchableOpacity>
                    )}

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
                            <Text style={[styles.cardTitle, { color: textColor }]}>
                                Create your account
                            </Text>
                            <Text style={[styles.cardSub, { color: subColor }]}>
                                Start processing car images for free — no credit card required
                            </Text>
                        </View>

                        {/* Error banner */}
                        {error ? (
                            <View style={styles.errorBanner}>
                                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Full name */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: subColor }]}>Full Name</Text>
                            <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: getBorder("name") }]}>
                                <Ionicons name="person-outline" size={18} color={focusedField === "name" ? Colors.gold : Colors.silver400} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    onFocus={() => setFocusedField("name")}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Alex Johnson"
                                    placeholderTextColor={isDark ? Colors.silver500 : Colors.silver300}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: subColor }]}>Work Email</Text>
                            <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: getBorder("email") }]}>
                                <Ionicons name="mail-outline" size={18} color={focusedField === "email" ? Colors.gold : Colors.silver400} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setFocusedField("email")}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="you@dealership.com"
                                    placeholderTextColor={isDark ? Colors.silver500 : Colors.silver300}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: subColor }]}>Password</Text>
                            <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: getBorder("password") }]}>
                                <Ionicons name="lock-closed-outline" size={18} color={focusedField === "password" ? Colors.gold : Colors.silver400} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setFocusedField("password")}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Create a strong password"
                                    placeholderTextColor={isDark ? Colors.silver500 : Colors.silver300}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} activeOpacity={0.7}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.silver400} />
                                </TouchableOpacity>
                            </View>

                            {/* Password strength */}
                            {password.length > 0 && (
                                <View style={styles.strength}>
                                    <View style={styles.strengthBars}>
                                        {[0, 1, 2].map((i) => (
                                            <View
                                                key={i}
                                                style={[
                                                    styles.strengthBar,
                                                    {
                                                        backgroundColor:
                                                            i < passwordStrength
                                                                ? strengthColors[passwordStrength - 1]
                                                                : border,
                                                    },
                                                ]}
                                            />
                                        ))}
                                    </View>
                                    <Text style={[styles.strengthLabel, { color: passwordStrength > 0 ? strengthColors[passwordStrength - 1] : subColor }]}>
                                        {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : ""}
                                    </Text>
                                </View>
                            )}

                            {/* Password rules */}
                            <View style={styles.rules}>
                                {PASSWORD_RULES.map((rule) => (
                                    <View key={rule.label} style={styles.rule}>
                                        <Ionicons
                                            name={rule.test(password) ? "checkmark-circle" : "ellipse-outline"}
                                            size={13}
                                            color={rule.test(password) ? Colors.success : Colors.silver400}
                                        />
                                        <Text style={[styles.ruleText, { color: rule.test(password) ? Colors.success : subColor }]}>
                                            {rule.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Terms checkbox */}
                        <TouchableOpacity
                            style={styles.termsRow}
                            onPress={() => setAgreed(!agreed)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, { borderColor: agreed ? Colors.gold : border, backgroundColor: agreed ? Colors.gold : "transparent" }]}>
                                {agreed && <Ionicons name="checkmark" size={13} color={Colors.carbon950} />}
                            </View>
                            <Text style={[styles.termsText, { color: subColor }]}>
                                I agree to the{" "}
                                <Text style={{ color: Colors.gold }}>Terms of Service</Text>
                                {" "}and{" "}
                                <Text style={{ color: Colors.gold }}>Privacy Policy</Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
                            onPress={handleSignup}
                            disabled={isLoading}
                            activeOpacity={0.85}
                        >
                            {isLoading ? (
                                <Text style={styles.submitText}>Creating account...</Text>
                            ) : (
                                <>
                                    <Text style={styles.submitText}>Create Free Account</Text>
                                    <Ionicons name="arrow-forward" size={18} color={Colors.carbon950} />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Login link */}
                        <View style={styles.loginRow}>
                            <Text style={[styles.loginText, { color: subColor }]}>
                                Already have an account?
                            </Text>
                            <TouchableOpacity onPress={() => router.push("/(auth)/login")} activeOpacity={0.7}>
                                <Text style={styles.loginLink}> Sign in</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
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
    highlights: {
        gap: 14,
    },
    highlightsTitle: {
        color: Colors.gold,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 0.5,
        marginBottom: 6,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    highlightItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    highlightDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.gold,
    },
    highlightText: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 15,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    rightPanel: {
        flex: isWide ? undefined : 1,
        width: isWide ? 500 : "100%",
    },
    scroll: {
        flexGrow: 1,
        justifyContent: "center",
        padding: isWide ? 48 : 24,
    },
    backBtn: {
        marginBottom: 16,
        padding: 8,
        alignSelf: "flex-start",
    },
    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 32,
        gap: 18,
    },
    cardHeader: { gap: 6 },
    cardTitle: {
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: -0.5,
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    cardSub: {
        fontSize: 14,
        lineHeight: 21,
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
    label: {
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0.2,
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
    },
    inputIcon: {},
    input: {
        flex: 1,
        fontSize: 15,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
        outlineStyle: "none" as any,
    },
    eyeBtn: { padding: 4 },
    strength: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 4,
    },
    strengthBars: {
        flexDirection: "row",
        gap: 4,
        flex: 1,
    },
    strengthBar: {
        flex: 1,
        height: 3,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: "600",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    rules: {
        gap: 5,
    },
    rule: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
    },
    ruleText: {
        fontSize: 12,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    termsRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 1,
    },
    termsText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
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
    loginRow: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
    },
    loginText: {
        fontSize: 14,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    loginLink: {
        fontSize: 14,
        color: Colors.gold,
        fontWeight: "700",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    successCard: {
        alignItems: "center",
        gap: 16,
        padding: 40,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${Colors.gold}18`,
        alignItems: "center",
        justifyContent: "center",
    },
    successTitle: {
        fontSize: 28,
        fontWeight: "800",
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    successSub: {
        fontSize: 15,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
});