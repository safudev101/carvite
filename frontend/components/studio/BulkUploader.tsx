import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet, Image, useWindowDimensions } from 'react-native';
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

    // Auto-select logic when images are added or removed
    useEffect(() => {
        if (images.length > 0 && !selectedId) {
            setSelectedId(images[0].id);
        } else if (images.length === 0) {
            setSelectedId(null);
        }
    }, [images, selectedId]);

    const activeImage = images.find(img => img.id === selectedId) || images[0];

    const pickImages = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            const newImages = result.assets.map((asset) => ({
                id: `img_${Date.now()}_${Math.random()}`,
                uri: asset.uri,
                fileName: asset.fileName || `car.jpg`,
                status: 'idle',
            }));
            addImages(newImages);
            if (!selectedId) setSelectedId(newImages[0].id);
        }
    };

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
            <View style={styles.navBar}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}><Text style={styles.logoText}>AV</Text></View>
                    <Text style={styles.brandName}>AutoVisio <Text style={{color: '#C9A84C'}}>Studio</Text></Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>1. SELECT STAGE</Text>
                    </View>
                    <BackgroundPicker />
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>2. VEHICLE PHOTOS ({images.length})</Text>
                        {images.length > 0 && !isProcessing && (
                            <TouchableOpacity onPress={clearAllImages}>
                                <Text style={styles.clearBtn}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isProcessing && (
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: `${processingProgress}%` }]} />
                            <Text style={styles.progressText}>AI Processing... {processingProgress}%</Text>
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
                                    </View>

                                    {!isProcessing && (
                                        <TouchableOpacity onPress={pickImages} style={styles.addMoreBtn}>
                                            <Ionicons name="add-circle" size={22} color="#C9A84C" />
                                            <Text style={styles.addMoreText}>Add more photos</Text>
                                        </TouchableOpacity>
                                    )}

                                    {images.length > 1 && (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselContainer}>
                                            {images.map((img) => (
                                                <TouchableOpacity 
                                                    key={img.id} 
                                                    onPress={() => setSelectedId(img.id)}
                                                    style={[
                                                        styles.thumbnailWrapper, 
                                                        selectedId === img.id && styles.thumbnailActive
                                                    ]}
                                                >
                                                    <Image source={{ uri: img.uri }} style={styles.thumbnailImage} />
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
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

            {/* 🔥 UPDATED DUAL FOOTER BUTTONS 🔥 */}
            {pendingImages.length > 0 && !isProcessing && (
                <View style={styles.footerContainer}>
                    <TouchableOpacity 
                        onPress={() => processAllImages(true)} 
                        style={[styles.actionBtn, styles.removeBgBtn]}
                    >
                        <Ionicons name="cut-outline" size={18} color="#C9A84C" style={{marginRight: 6}} />
                        <Text style={styles.removeBgBtnText}>REMOVE BG</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => processAllImages(false)} 
                        style={[styles.actionBtn, styles.enhanceBtn]}
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
    navBar: { 
        height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', backgroundColor: '#000',
        paddingTop: Platform.OS === 'ios' ? 20 : 0
    },
    logoContainer: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { width: 32, height: 32, backgroundColor: '#C9A84C', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    brandName: { color: '#fff', fontSize: 18, fontWeight: '800' },
    scrollContent: { padding: 12 },
    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
    clearBtn: { color: '#FF4444', fontSize: 12, fontWeight: '600' },
    emptyAddCardMobile: { width: '100%', aspectRatio: 16/9, backgroundColor: '#0A0A0A', borderRadius: 14, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
    mainFocusCard: { width: '100%', borderRadius: 14, marginBottom: 12 },
    addMoreBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#222', marginBottom: 16 },
    addMoreText: { color: '#ccc', fontSize: 14, fontWeight: '600', marginLeft: 8 },
    carouselContainer: { flexDirection: 'row', marginBottom: 10 },
    thumbnailWrapper: { width: 70, height: 50, borderRadius: 8, marginRight: 10, borderWidth: 2, borderColor: '#222', overflow: 'hidden' },
    thumbnailActive: { borderColor: '#C9A84C' },
    thumbnailImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: Platform.OS === 'web' ? '23.5%' : '48%' }, 
    addCard: { width: Platform.OS === 'web' ? '23.5%' : '48%', aspectRatio: 16/9, backgroundColor: '#0A0A0A', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#222', justifyContent: 'center', alignItems: 'center' },
    addText: { color: '#666', fontSize: 12, marginTop: 8, fontWeight: '600' },
    progressContainer: { height: 35, backgroundColor: '#0A0A0A', borderRadius: 10, marginBottom: 20, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#1A1A1A' },
    progressBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(201, 168, 76, 0.2)' },
    progressText: { textAlign: 'center', color: '#C9A84C', fontSize: 11, fontWeight: 'bold' },
    
    // 🔥 New Footer Styles 🔥
    footerContainer: { 
        position: 'absolute', 
        bottom: 30, 
        left: 20, 
        right: 20, 
        flexDirection: 'row', 
        gap: 12 
    },
    actionBtn: { 
        flex: 1, 
        height: 55, 
        borderRadius: 18, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        elevation: 8 
    },
    enhanceBtn: { backgroundColor: '#C9A84C' },
    removeBgBtn: { backgroundColor: '#111', borderWidth: 1, borderColor: '#C9A84C' },
    enhanceBtnText: { color: '#000', fontWeight: '900', fontSize: 13 },
    removeBgBtnText: { color: '#C9A84C', fontWeight: '900', fontSize: 13 },
});
