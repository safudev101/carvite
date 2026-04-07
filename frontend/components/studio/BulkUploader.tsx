import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStudioStore } from '@/stores/studioStore';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { BackgroundPicker } from './BackgroundPicker'; // categories wala picker
import { ImageCard } from './ImageCard'; // categories standard categories card

export const BulkUploader: React.FC = () => {
    const { images, addImages, clearAllImages, selectedBackground } = useStudioStore();
    const { processAllImages, isProcessing, processingProgress } = useImageProcessor();

    // Permissions logic
    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Hamain gallery ka access chahiye images add karne ke liye.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 10,
            quality: 1,
        });

        if (!result.canceled) {
            const newImages = result.assets.map((asset) => ({
                id: `img_${Date.now()}_${Math.random()}`,
                uri: asset.uri,
                fileName: asset.fileName || `car_${Date.now()}.jpg`,
                fileSize: asset.fileSize || 0,
                status: 'idle',
            }));
            addImages(newImages);
        }
    };

    // FIX: logic standard agar koi image processing standard queue mein ho, ya error ho, tabhi button dikhao.
    // Error state wali images ko dobara process karne ka option zaroori hai.
    const hasPendingImages = images.some(img => img.status === 'idle' || img.status === 'queued' || img.status === 'error');
    const allDone = images.length > 0 && images.every(img => img.status === 'done');

    return (
        <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header section (Categories & Stats) */}
            <View style={{ marginBottom: 20 }}>
                <BackgroundPicker /> {/* Categories standard categories standard picker */}
            </View>

            {/* Upload Queue Section */}
            <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                        UPLOAD QUEUE <Text style={{ color: '#999', fontSize: 12 }}>({images.length} photos)</Text>
                    </Text>
                    {images.length > 0 && !isProcessing && (
                        <TouchableOpacity onPress={clearAllImages}>
                            <Text style={{ color: '#C9A84C', fontSize: 13, fontWeight: '600' }}>Clear All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Processing Overlay standard loading */}
                {isProcessing && (
                    <View style={{ backgroundColor: 'rgba(201, 168, 76, 0.1)', padding: 12, borderRadius: 10, marginBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <ActivityIndicator color="#C9A84C" size="small" />
                        <Text style={{ color: '#fff', fontSize: 13, flex: 1 }}>Processing car photos...</Text>
                        <Text style={{ color: '#C9A84C', fontSize: 13, fontWeight: '700' }}>{processingProgress}%</Text>
                    </View>
                )}

                {/* Images Grid standard queue standard */}
                <View style={{ gap: 12 }}>
                    {images.map((img) => (
                        <ImageCard key={img.id} image={img} /> // standard categories and cards logic
                    ))}
                    
                    {/* Add Images Button standard categories */}
                    {!isProcessing && images.length < 10 && (
                        <TouchableOpacity onPress={pickImages} style={{ height: 60, borderRadius: 10, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="add-circle-outline" size={18} color="#999" />
                                <Text style={{ color: '#999', fontSize: 14 }}>Add Car Photos</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Bottom Enhance Button (The main action) */}
            {images.length > 0 && !isProcessing && (
                <View style={{ marginTop: 20 }}>
                    {hasPendingImages && (
                        <TouchableOpacity 
                            onPress={processAllImages}
                            style={{ backgroundColor: '#C9A84C', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
                        >
                            <Ionicons name="sparkles-outline" size={20} color="#000" />
                            <Text style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Enhance {images.filter(img => img.status === 'idle' || img.status === 'queued' || img.status === 'error').length} Photos</Text>
                        </TouchableOpacity>
                    )}
                    
                    {allDone && (
                        <TouchableOpacity 
                            style={{ backgroundColor: 'rgba(255,255,255,0.08)', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
                        >
                            <Ionicons name="download-outline" size={20} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Download All</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
            
            {/* Show uploader if no images */}
            {images.length === 0 && (
                <TouchableOpacity onPress={pickImages} style={{ height: 200, borderRadius: 15, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A', marginTop: 20 }}>
                    <Ionicons name="cloud-upload-outline" size={30} color="#666" />
                    <Text style={{ color: '#999', fontSize: 15, marginTop: 10 }}>Tap to upload car photos</Text>
                </TouchableOpacity>
            )}

        </ScrollView>
    );
};
