import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useStudioStore } from '@/stores/studioStore';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { BackgroundPicker } from './BackgroundPicker';
import { ImageCard } from './ImageCard';

const { width: screenWidth } = Dimensions.get('window');

export const BulkUploader: React.FC = () => {
    const { images, addImages, clearAllImages, isProcessing, processingProgress } = useStudioStore();
    const { processAllImages } = useImageProcessor();
    const [selectedId, setSelectedId] = useState<string | null>(null);

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
        }
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
            {/* Nav Bar logic same rahegi */}
            <View style={styles.navBar}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}><Text style={styles.logoText}>AV</Text></View>
                    <Text style={styles.brandName}>AutoVisio <Text style={{color: '#C9A84C'}}>Studio</Text></Text>
                </View>
                <View style={styles.navIcons}>
                    <TouchableOpacity style={styles.iconBtn}><Ionicons name="layers-outline" size={20} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><Ionicons name="person-outline" size={20} color="#fff" /></TouchableOpacity>
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

                    <View style={styles.grid}>
                        {images.map((img) => {
                            const isSelected = selectedId === img.id;
                            return (
                                <TouchableOpacity 
                                    key={img.id} 
                                    activeOpacity={0.9}
                                    onPress={() => setSelectedId(img.id)}
                                    // FIXED: Card wrapper ki width aur margin ko responsive kiya
                                    style={[
                                        styles.cardWrapper, 
                                        isSelected && styles.cardSelected
                                    ]}
                                >
                                    <ImageCard 
                                        image={img} 
                                        isSelected={isSelected} // Pass selection state
                                        onSelect={() => setSelectedId(img.id)}
                                        onRemove={() => {/* call store remove */}}
                                        onDownload={() => img.resultUri && handleDownload(img.resultUri)} 
                                    />
                                    
                                    {isSelected && (
                                        <View style={styles.tickOverlay}>
                                            <Ionicons name="checkmark-circle" size={22} color="#C9A84C" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}

                        {!isProcessing && (
                            <TouchableOpacity onPress={pickImages} style={styles.addCard}>
                                <Ionicons name="camera-outline" size={28} color="#444" />
                                <Text style={styles.addText}>Add Photo</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                
                <View style={{ height: 120 }} />
            </ScrollView>

            {pendingImages.length > 0 && !isProcessing && (
                <View style={styles.footer}>
                    <TouchableOpacity onPress={processAllImages} style={styles.enhanceBtn}>
                        <Ionicons name="sparkles" size={20} color="#000" style={{marginRight: 8}} />
                        <Text style={styles.enhanceBtnText}>ENHANCE {pendingImages.length} PHOTOS</Text>
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
    navIcons: { flexDirection: 'row', gap: 12 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
    
    scrollContent: { padding: 12 },
    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
    clearBtn: { color: '#FF4444', fontSize: 12, fontWeight: '600' },

    // ✅ FIXED GRID: Flex wrap aur responsive widths
    grid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
    },
    cardWrapper: { 
        // FIXED: Remove fixed aspectRatio here because ImageCard handles it
        width: Platform.OS === 'web' ? '24%' : '48%', 
        marginBottom: 16,
        borderRadius: 14,
        position: 'relative',
    },
    cardSelected: {
        // Selection style
    },
    tickOverlay: {
        position: 'absolute',
        top: 6,
        left: 6, // Moved to left to avoid clashing with remove button
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
    },
    addCard: { 
        width: Platform.OS === 'web' ? '24%' : '48%',
        aspectRatio: 16/9, // Match the ImageCard ratio
        backgroundColor: '#0A0A0A', 
        borderRadius: 12, 
        borderStyle: 'dashed', 
        borderWidth: 1.5, 
        borderColor: '#222', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: 16,
    },
    addText: { color: '#444', fontSize: 11, marginTop: 4, fontWeight: '600' },

    progressContainer: { height: 35, backgroundColor: '#0A0A0A', borderRadius: 10, marginBottom: 20, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#1A1A1A' },
    progressBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(201, 168, 76, 0.2)' },
    progressText: { textAlign: 'center', color: '#C9A84C', fontSize: 11, fontWeight: 'bold' },

    footer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
    enhanceBtn: { 
        backgroundColor: '#C9A84C', height: 55, borderRadius: 18, flexDirection: 'row', 
        justifyContent: 'center', alignItems: 'center', elevation: 8 
    },
    enhanceBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },
});
