import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Colors } from "../../constants/colors";

export default function Footer() {
    const { isDark } = useTheme();

    const bg = isDark ? Colors.carbon900 : Colors.light.surfaceAlt;
    const border = isDark ? Colors.carbon600 : Colors.light.border;
    const text = isDark ? Colors.dark.textSecondary : Colors.light.textSecondary;
    const textMuted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;

    const links = [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Contact", href: "/contact" },
        { label: "API Docs", href: "/docs" },
    ];

    return (
        <View style={[styles.container, { backgroundColor: bg, borderTopColor: border }]}>
            <View style={styles.inner}>
                {/* Brand */}
                <View style={styles.brandSection}>
                    <View style={styles.logoMark}>
                        <Text style={styles.logoText}>AV</Text>
                    </View>
                    <View style={{ marginTop: 12, maxWidth: 280 }}>
                        <Text style={[styles.brandName, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
                            AutoVisio Studio
                        </Text>
                        <Text style={[styles.brandDesc, { color: textMuted }]}>
                            Professional AI-powered automotive image processing. Remove backgrounds, apply studio
                            backdrops, and deliver showroom-quality photos in seconds.
                        </Text>
                    </View>
                </View>

                {/* Links */}
                <View style={styles.linksSection}>
                    {links.map((link) => (
                        <TouchableOpacity key={link.label} style={styles.link} activeOpacity={0.7}>
                            <Text style={[styles.linkText, { color: text }]}>{link.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Bottom bar */}
            <View style={[styles.bottom, { borderTopColor: border }]}>
                <Text style={[styles.copyright, { color: textMuted }]}>
                    © {new Date().getFullYear()} AutoVisio Studio. All rights reserved.
                </Text>
                <Text style={[styles.powered, { color: textMuted }]}>
                    Powered by{" "}
                    <Text style={{ color: Colors.gold }}>rembg AI</Text>
                    {" "}·{" "}
                    <Text style={{ color: Colors.gold }}>Supabase</Text>
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: 48,
    },
    inner: {
        paddingHorizontal: 32,
        flexDirection: Platform.OS === "web" ? "row" : "column",
        justifyContent: "space-between",
        gap: 40,
        maxWidth: 1200,
        alignSelf: "center",
        width: "100%",
    },
    brandSection: {},
    logoMark: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: Colors.gold,
        alignItems: "center",
        justifyContent: "center",
    },
    logoText: {
        color: Colors.carbon950,
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 1,
        fontFamily: Platform.select({ web: "Playfair Display", default: "serif" }),
    },
    brandName: {
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.3,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
        marginBottom: 8,
    },
    brandDesc: {
        fontSize: 13,
        lineHeight: 20,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    linksSection: {
        gap: 16,
    },
    link: {},
    linkText: {
        fontSize: 14,
        fontWeight: "500",
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    bottom: {
        marginTop: 48,
        paddingVertical: 20,
        paddingHorizontal: 32,
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: Platform.OS === "web" ? "row" : "column",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        maxWidth: 1200,
        alignSelf: "center",
        width: "100%",
    },
    copyright: {
        fontSize: 12,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    powered: {
        fontSize: 12,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
});