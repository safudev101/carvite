import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, useWindowDimensions, Animated, Easing } from 'react-native';
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
    const { processSingleImageAction } = useImageProcessor(); // 👇 Naya function use karenge (niche batata hoon)
    const [selectedId, setSelectedId] = useState<string | null>(null);
    
    const scanAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isProcessing) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
                    Animated.timing(scanAnim, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
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
        outputRange: [0, isMobile ? 220 : 300], // Adjust height
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

                    {/* Progress Bar with smooth transition */}
                    {isProcessing && (
                        <View style={styles.progressContainer}>
                            <Animated.View style={[styles.progressBar, { width: `${processingProgress}%` }]} />
                            <Text style={styles.progressText}>AI PROCESSING... {processingProgress}%</Text>
                        </View>
                    )}

                    {images.length === 0 ? (
                        <TouchableOpacity onPress={pickImages} style={styles.emptyAddCard}>
                            <Ionicons name="camera-outline" size={36} color="#444" />
                            <Text style={styles.addText}>Add Photos</Text>
                        </TouchableOpacity>
                    ) : (
                        <View>
                            {/* 🌟 MAIN FOCUS CAROUSEL VIEW 🌟 */}
                            <View style={styles.mainFocusCard}>
                                <ImageCard 
                                    image={activeImage} 
                                    isSelected={true} 
                                    onSelect={() => {}} 
                                    onRemove={() => removeImage(activeImage.id)} 
                                />
                                {/* Scanning Line inside hidden overflow */}
                                {isProcessing && activeImage.status === 'processing' && (
                                    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                                )}
                            </View>

                            {/* Thumbnails */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailList}>
                                {images.map((img) => (
                                    <TouchableOpacity 
                                        key={img.id} 
                                        onPress={() => setSelectedId(img.id)}
                                        style={[styles.thumbnailWrapper, selectedId === img.id && styles.thumbnailSelected]}
                                    >
                                        <Image source={{ uri: img.resultUri || img.uri }} style={styles.thumbnailImg} />
                                        {img.status === 'done' && <View style={styles.doneDot} />}
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity onPress={pickImages} style={styles.addThumbBtn}>
                                    <Ionicons name="add" size={24} color="#C9A84C" />
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    )}
                </View>
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* 🌟 FIX 7: BUTTONS NEVER DISAPPEAR NOW 🌟 */}
            {images.length > 0 && (
                <View style={styles.footerContainer}>
                    <TouchableOpacity 
                        onPress={() => processSingleImageAction(activeImage.id, true)} 
                        disabled={isProcessing}
                        style={[styles.actionBtn, styles.removeBgBtn, isProcessing && { opacity: 0.5 }]}
                    >
                        <Ionicons name="cut-outline" size={18} color="#C9A84C" style={{marginRight: 6}} />
                        <Text style={styles.removeBgBtnText}>REMOVE BG</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => processSingleImageAction(activeImage.id, false)} 
                        disabled={isProcessing}
                        style={[styles.actionBtn, styles.enhanceBtn, isProcessing && { opacity: 0.5 }]}
                    >
                        <Ionicons name="sparkles" size={18} color="#000" style={{marginRight: 6}} />
                        <Text style={styles.enhanceBtnText}>ENHANCE AI</Text>
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
    emptyAddCard: { width: '100%', aspectRatio: 16/9, backgroundColor: '#0A0A0A', borderRadius: 14, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
    
    // MAIN VIEW STYLES
    mainFocusCard: { width: '100%', aspectRatio: 4/3, borderRadius: 14, overflow: 'hidden', position: 'relative', marginBottom: 12 },
    scanLine: { position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: '#C9A84C', zIndex: 10, shadowColor: "#C9A84C", shadowRadius: 10, elevation: 5 },
    
    // THUMBNAILS STYLES
    thumbnailList: { flexDirection: 'row', gap: 10, paddingVertical: 5 },
    thumbnailWrapper: { width: 60, height: 60, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
    thumbnailSelected: { borderColor: '#C9A84C' },
    thumbnailImg: { width: '100%', height: '100%' },
    addThumbBtn: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#111', borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
    doneDot: { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ADE80' },

    progressContainer: { height: 40, backgroundColor: '#0A0A0A', borderRadius: 12, marginBottom: 20, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#1A1A1A' },
    progressBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#C9A84C', opacity: 0.4 },
    progressText: { textAlign: 'center', color: '#fff', fontSize: 11, fontWeight: '900', zIndex: 1 },
    
    footerContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, height: 55, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    enhanceBtn: { backgroundColor: '#C9A84C' },
    removeBgBtn: { backgroundColor: '#111', borderWidth: 1, borderColor: '#C9A84C' },
    enhanceBtnText: { color: '#000', fontWeight: '900', fontSize: 13 },
    removeBgBtnText: { color: '#C9A84C', fontWeight: '900', fontSize: 13 },
});
