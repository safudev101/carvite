import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet, Image, useWindowDimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
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
    
    // Animation Value for Scanning Line
    const scanAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isProcessing) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanAnim, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
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
        outputRange: [0, isMobile ? 200 : 300], // Adjust based on card height
    });

    const handleRemove = (id: string) => {
        if (selectedId === id) {
            const remaining = images.filter(img => img.id !== id);
            setSelectedId(remaining.length > 0 ? remaining[0].id : null);
        }
        removeImage(id);
    };

    const handleDownload = async (uri: string) => {
        if (Platform.OS === 'web') {
            const link = document.createElement('a');
            link.href = uri;
            link.download = `autovisio_car_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
                await MediaLibrary.createAssetAsync(uri);
                alert("Saved to Gallery! ✨");
            }
        }
    };

    const pendingImages = images.filter(img => img.status === 'idle' || img.status === 'error');

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

                    {isMobile ? (
                        <View>
                            {images.length === 0 ? (
                                <TouchableOpacity onPress={pickImages} style={styles.emptyAddCardMobile}>
                                    <Ionicons name="camera-outline" size={36} color="#444" />
                                    <Text style={styles.addText}>Add Photo</Text>
                                </TouchableOpacity>
                            ) : (
                                <View>
                                    <View style={styles.mainFocusCard}>
                                        <ImageCard 
                                            image={activeImage} 
                                            isSelected={false} 
                                            onSelect={() => {}} 
                                            onRemove={() => handleRemove(activeImage.id)} 
                                            onDownload={() => activeImage.resultUri && handleDownload(activeImage.resultUri)} 
                                        />
                                        {/* SCANNING LINE OVERLAY */}
                                        {isProcessing && activeImage.status === 'processing' && (
                                            <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                                        )}
                                    </View>
                                    {!isProcessing && (
                                        <TouchableOpacity onPress={pickImages} style={styles.addMoreBtn}>
                                            <Ionicons name="add-circle" size={22} color="#C9A84C" />
                                            <Text style={styles.addMoreText}>Add more photos</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.grid}>
                            {images.map((img) => (
                                <View key={img.id} style={styles.gridItem}>
                                    <ImageCard 
                                        image={img} 
                                        isSelected={selectedId === img.id} 
                                        onSelect={() => setSelectedId(img.id)} 
                                        onRemove={() => handleRemove(img.id)} 
                                        onDownload={() => img.resultUri && handleDownload(img.resultUri)} 
                                    />
                                    {isProcessing && img.status === 'processing' && (
                                        <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                                    )}
                                </View>
                            ))}
                            {!isProcessing && (
                                <TouchableOpacity onPress={pickImages} style={styles.addCard}>
                                    <Ionicons name="camera-outline" size={28} color="#444" />
                                    <Text style={styles.addText}>Add Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
                <View style={{ height: 120 }} />
            </ScrollView>

            {pendingImages.length > 0 && !isProcessing && (
                <View style={styles.footerContainer}>
                    <TouchableOpacity onPress={() => processAllImages(true)} style={[styles.actionBtn, styles.removeBgBtn]}>
                        <Ionicons name="cut-outline" size={18} color="#C9A84C" style={{marginRight: 6}} />
                        <Text style={styles.removeBgBtnText}>REMOVE BG</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => processAllImages(false)} style={[styles.actionBtn, styles.enhanceBtn]}>
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
    emptyAddCardMobile: { width: '100%', aspectRatio: 16/9, backgroundColor: '#0A0A0A', borderRadius: 14, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
    mainFocusCard: { width: '100%', borderRadius: 14, marginBottom: 12, overflow: 'hidden', position: 'relative' },
    gridItem: { width: Platform.OS === 'web' ? '23.5%' : '48%', overflow: 'hidden', position: 'relative' },
    
    // SCANNING LINE STYLE
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#C9A84C',
        zIndex: 10,
        shadowColor: "#C9A84C",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 10,
    },

    addMoreBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#222', marginBottom: 16 },
    addMoreText: { color: '#ccc', fontSize: 14, fontWeight: '600', marginLeft: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    addCard: { width: Platform.OS === 'web' ? '23.5%' : '48%', aspectRatio: 16/9, backgroundColor: '#0A0A0A', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#222', justifyContent: 'center', alignItems: 'center' },
    addText: { color: '#666', fontSize: 12, marginTop: 8, fontWeight: '600' },
    
    progressContainer: { height: 40, backgroundColor: '#0A0A0A', borderRadius: 12, marginBottom: 20, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#1A1A1A' },
    progressBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#C9A84C', opacity: 0.3 },
    progressText: { textAlign: 'center', color: '#C9A84C', fontSize: 11, fontWeight: '900', zIndex: 1 },
    
    footerContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, height: 55, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 8 },
    enhanceBtn: { backgroundColor: '#C9A84C' },
    removeBgBtn: { backgroundColor: '#111', borderWidth: 1, borderColor: '#C9A84C' },
    enhanceBtnText: { color: '#000', fontWeight: '900', fontSize: 13 },
    removeBgBtnText: { color: '#C9A84C', fontWeight: '900', fontSize: 13 },
});
