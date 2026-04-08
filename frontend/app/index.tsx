import React, { useEffect, useState } from "react";
import { ScrollView, View, StyleSheet, Platform, Dimensions } from "react-native";
import { useAuthStore } from "../stores/authStore";
import { useTheme } from "../hooks/useTheme";
import { Colors } from "../constants/colors";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorks from "@/components/landing/HowItWorks";
import CTASection from "@/components/landing/CTASection";
import LoadingScreen from "@/components/shared/LoadingScreen";

const { width } = Dimensions.get('window');

export default function LandingPage() {
    const { isInitialized } = useAuthStore();
    const { isDark } = useTheme();
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Show splash briefly, then reveal landing
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 1800);
        return () => clearTimeout(timer);
    }, []);

    if (showSplash || !isInitialized) {
        return <LoadingScreen message="Initializing Studio..." />;
    }

    return (
        <View style={[styles.root, { backgroundColor: isDark ? Colors.carbon950 : Colors.light.background }]}>
            {/* Sticky header */}
            <Header transparent={false} showNav />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[]}
            >
            <View style={styles.innerContainer}>
                <HeroSection />
                <FeaturesSection />
                <HowItWorks />
                <CTASection />
                <Footer />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        // Android par horizontal overflow rokne ke liye
        width: '100%', 
    },
    innerContainer: {
        width: '100%',
        // Web par bohot zyada wide na ho jaye
        maxWidth: Platform.OS === 'web' ? 1400 : '100%', 
        alignSelf: 'center', // Center mein rakhega content ko
    }
});
