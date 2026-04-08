import React, { useRef, useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform,
    Dimensions,
    Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../stores/authStore";
import { Colors } from "../../constants/colors";

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

export default function Header({ transparent = false }: { transparent?: boolean }) {
    const { isDark, toggleTheme } = useTheme();
    const { user } = useAuthStore();
    const router = useRouter();
    
    // Burger Menu State & Animation
    const [menuOpen, setMenuOpen] = useState(false);
    const menuAnim = useRef(new Animated.Value(screenWidth)).current; // Start off-screen (right)

    const toggleMenu = () => {
        if (!menuOpen) {
            setMenuOpen(true);
            Animated.timing(menuAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(menuAnim, {
                toValue: screenWidth,
                duration: 250,
                useNativeDriver: true,
            }).start(() => setMenuOpen(false));
        }
    };

    const navLinks = [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/#pricing" },
        { label: "Showroom", href: "/showroom" },
    ];

    const textColor = isDark ? Colors.dark.text : Colors.light.text;
    const borderColor = isDark ? Colors.carbon600 : Colors.light.border;
    const bg = transparent ? "transparent" : (isDark ? Colors.carbon900 : Colors.light.surface);

    return (
        <View style={[styles.container, { backgroundColor: bg, borderBottomColor: borderColor }]}>
            {/* Left: Logo */}
            <TouchableOpacity style={styles.logo} onPress={() => router.push("/")}>
                <View style={styles.logoMark}><Text style={styles.logoMarkText}>AV</Text></View>
                {!isMobile && <Text style={[styles.logoName, { color: textColor }]}>AutoVisio</Text>}
            </TouchableOpacity>

            {/* Center: Desktop Nav Links */}
            {!isMobile && (
                <View style={styles.navLinks}>
                    {navLinks.map((link) => (
                        <TouchableOpacity key={link.label} onPress={() => router.push(link.href as any)}>
                            <Text style={[styles.navLinkText, { color: isDark ? Colors.silver300 : Colors.silver600 }]}>
                                {link.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Right: Actions (Theme + Button + Burger) */}
            <View style={styles.actions}>
                <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { borderColor }]}>
                    <Ionicons name={isDark ? "sunny" : "moon"} size={18} color={isDark ? Colors.gold : Colors.silver500} />
                </TouchableOpacity>

                {!isMobile && (
                    <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push("/(auth)/signup")}>
                        <Text style={styles.ctaBtnText}>Get Started</Text>
                    </TouchableOpacity>
                )}

                {isMobile && (
                    <TouchableOpacity onPress={toggleMenu} style={styles.burgerBtn}>
                        <Ionicons name="menu" size={28} color={textColor} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Mobile Burger Menu Overlay */}
            {menuOpen && (
                <Modal transparent visible={menuOpen} animationType="none">
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={styles.closeArea} onPress={toggleMenu} />
                        <Animated.View style={[styles.drawer, { transform: [{ translateX: menuAnim }], backgroundColor: isDark ? Colors.carbon800 : "#fff" }]}>
                            <View style={styles.drawerHeader}>
                                <Text style={[styles.drawerTitle, { color: textColor }]}>Menu</Text>
                                <TouchableOpacity onPress={toggleMenu}>
                                    <Ionicons name="close" size={30} color={textColor} />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.drawerContent}>
                                {navLinks.map((link) => (
                                    <TouchableOpacity 
                                        key={link.label} 
                                        style={styles.drawerLink} 
                                        onPress={() => { toggleMenu(); router.push(link.href as any); }}
                                    >
                                        <Text style={[styles.drawerLinkText, { color: textColor }]}>{link.label}</Text>
                                    </TouchableOpacity>
                                ))}
                                
                                <TouchableOpacity 
                                    style={[styles.ctaBtn, { marginTop: 20, width: '100%' }]} 
                                    onPress={() => { toggleMenu(); router.push("/(auth)/signup"); }}
                                >
                                    <Text style={styles.ctaBtnText}>Get Started</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: isMobile ? 16 : 40,
        height: 70,
        borderBottomWidth: 1,
        zIndex: 1000,
    },
    logo: { flexDirection: "row", alignItems: "center", gap: 10 },
    logoMark: { width: 34, height: 34, backgroundColor: Colors.gold, borderRadius: 8, justifyContent: "center", alignItems: "center" },
    logoMarkText: { fontWeight: "800", color: "#000" },
    logoName: { fontSize: 18, fontWeight: "700" },
    navLinks: { flexDirection: "row", gap: 25 },
    navLinkText: { fontSize: 15, fontWeight: "500" },
    actions: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: "center", alignItems: "center" },
    ctaBtn: { backgroundColor: Colors.gold, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    ctaBtnText: { color: "#000", fontWeight: "700", textAlign: 'center' },
    burgerBtn: { padding: 4 },
    // Modal & Drawer Styles
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", flexDirection: "row" },
    closeArea: { flex: 1 },
    drawer: { width: 280, height: "100%", padding: 25, elevation: 5 },
    drawerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 40 },
    drawerTitle: { fontSize: 20, fontWeight: "700" },
    drawerContent: { gap: 20 },
    drawerLink: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ccc' },
    drawerLinkText: { fontSize: 18, fontWeight: "500" },
});
