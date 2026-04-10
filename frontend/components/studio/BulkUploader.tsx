import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet, Image, useWindowDimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStudioStore } from '@/stores/studioStore';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { BackgroundPicker } from './BackgroundPicker';
import { ImageCard } from './ImageCard';

export const BulkUploader: React.FC = () => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const { images, addImages, removeImage, clearAllImages, isProcessing, processingProgress } = useStudioStore();
    const { processAllImages } = useImageProcessor();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const scanAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isProcessing) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
                    Animated.timing(scanAnim, { toValue: 0, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
                ])
            ).start();
        } else {
            scanAnim.setValue(0);
        }
    }, [isProcessing]);

    useEffect(() => {
        if (images.length > 0 && !selectedId) {
            setSelectedId(images[0].id);
        } else if (images.length === 0) {
            setSelectedId(null);
        }
    }, [images, selectedId]);

    const activeImage = images.find(img => img.id === selectedId) || images[0];

    const translateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, isMobile ? 180 : 250],
    });

    const pickImages = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImages = result.assets.map((asset) => ({
                id: `img_${Date.now()}_${Math.random()}`,
                uri: asset.uri,
                fileName: asset.fileName || `car.jpg`,
                status: 'idle' as const,
            }));
            addImages(newImages);
            if (!selectedId) setSelectedId(newImages[0].id);
        }
    };

    const handleDownload = async (uri: string) => {
        if (Platform.OS === 'web') {
            const link = document.createElement('a');
            link.href = uri;
            link.download = `autovisio_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            try {
                const MediaLibrary = require('expo-media-library');
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status === 'granted') {
                    await MediaLibrary.createAssetAsync(uri);
                    alert("Saved to Gallery! ✨");
                }
            } catch (err) {
                console.error("Save error:", err);
            }
        }
    };

    // ✅ FIX 2: pendingImages صرف count/logic ke liye — buttons ki visibility images.length se
    const pendingImages = images.filter(img => img.status === 'idle' || img.status === 'error');
    const hasPending = pendingImages.length > 0;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>1. SELECT STAGE</Text></View>
                    <BackgroundPicker />
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>2. VEHICLE PHOTOS ({images.length})</Text>
                        {images.length > 0 && !isProcessing && (
                            <TouchableOpacity onPress={clearAllImages}><Text style={styles.clearBtn}>Clear All</Text></TouchableOpacity>
                        )}
                    </View>

                    {isProcessing && (
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: `${processingProgress}%` }]} />
                            <Text style={styles.progressText}>AI PROCESSING... {processingProgress}%</Text>
                        </View>
                    )}

                    <View style={styles.gridContainer}>
                        {images.length === 0 ? (
                            <TouchableOpacity onPress={pickImages} style={styles.emptyAddCard}>
                                <Ionicons name="camera-outline" size={36} color="#444" />
                                <Text style={styles.addText}>Add Photos</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.grid}>
                                {images.map((img) => (
                                    <View key={img.id} style={isMobile ? styles.mobileGridItem : styles.webGridItem}>
                                        <ImageCard
                                            image={img}
                                            isSelected={selectedId === img.id}
                                            onSelect={() => setSelectedId(img.id)}
                                            onRemove={() => removeImage(img.id)}
                                            onDownload={() => img.resultUri && handleDownload(img.resultUri)}
                                        />
                                        {isProcessing && img.status === 'processing' && (
                                            <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                                        )}
                                    </View>
                                ))}
                                {!isProcessing && (
                                    <TouchableOpacity onPress={pickImages} style={isMobile ? styles.mobileGridItem : styles.webGridItem}>
                                        <View style={styles.addMoreGridBtn}>
                                            <Ionicons name="add" size={30} color="#C9A84C" />
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>
                <View style={{ height: 120 }} />
            </ScrollView>

            {/*
              ✅ FIX 2: Buttons ab images.length > 0 par dikhenge
              — processed (done) images ke baad bhi buttons mojood rahenge
              — sirf tab ghayab honge jab processing chal rahi ho ya koi image hi na ho
              — hasPending se button ka disabled/opacity control hota hai
            */}
            {images.length > 0 && !isProcessing && (
                <View style={styles.footerContainer}>
                    <TouchableOpacity
                        onPress={() => hasPending && processAllImages(true)}
                        style={[
                            styles.actionBtn,
                            styles.removeBgBtn,
                            !hasPending && styles.btnDisabled,  // Disabled look jab koi pending na ho
                        ]}
                    >
                        <Ionicons name="cut-outline" size={18} color={hasPending ? "#C9A84C" : "#555"} style={{ marginRight: 6 }} />
                        <Text style={[styles.removeBgBtnText, !hasPending && styles.btnTextDisabled]}>REMOVE BG</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => hasPending && processAllImages(false)}
                        style={[
                            styles.actionBtn,
                            styles.enhanceBtn,
                            !hasPending && styles.enhanceBtnDisabled,
                        ]}
                    >
                        <Ionicons name="sparkles" size={18} color={hasPending ? "#000" : "#555"} style={{ marginRight: 6 }} />
                        <Text style={[styles.enhanceBtnText, !hasPending && styles.btnTextDisabled]}>ENHANCE AI</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    scrollContent: { padding: 12 },
    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
    clearBtn: { color: '#FF4444', fontSize: 12, fontWeight: '600' },
    gridContainer: { width: '100%' },
    emptyAddCard: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#0A0A0A', borderRadius: 14, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    mobileGridItem: { width: '48.5%' },
    webGridItem: { width: '23.5%' },
    addMoreGridBtn: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#0A0A0A', borderRadius: 14, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#222', justifyContent: 'center', alignItems: 'center' },
    addText: { color: '#666', fontSize: 12, marginTop: 8, fontWeight: '600' },
    scanLine: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: '#C9A84C', zIndex: 10, shadowColor: "#C9A84C", shadowRadius: 10, elevation: 5 },
    progressContainer: { height: 40, backgroundColor: '#0A0A0A', borderRadius: 12, marginBottom: 20, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#1A1A1A' },
    progressBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#C9A84C', opacity: 0.3 },
    progressText: { textAlign: 'center', color: '#C9A84C', fontSize: 11, fontWeight: '900', zIndex: 1 },
    footerContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, height: 55, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    enhanceBtn: { backgroundColor: '#C9A84C' },
    enhanceBtnDisabled: { backgroundColor: '#2a2a2a' },  // ✅ Disabled state
    removeBgBtn: { backgroundColor: '#111', borderWidth: 1, borderColor: '#C9A84C' },
    btnDisabled: { borderColor: '#333', opacity: 0.5 },  // ✅ Disabled state
    enhanceBtnText: { color: '#000', fontWeight: '900', fontSize: 13 },
    removeBgBtnText: { color: '#C9A84C', fontWeight: '900', fontSize: 13 },
    btnTextDisabled: { color: '#555' },  // ✅ Disabled text color
});
