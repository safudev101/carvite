import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStudioStore } from '@/stores/studioStore';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { BackgroundPicker } from './BackgroundPicker';
import { ImageCard } from './ImageCard';

export const BulkUploader: React.FC = () => {
    const { images, addImages, clearAllImages, isProcessing, processingProgress } = useStudioStore();
    const { processAllImages } = useImageProcessor();

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

    const hasImages = images.length > 0;
    const pendingImages = images.filter(img => img.status === 'idle' || img.status === 'error');

    return (
        <ScrollView style={{ flex: 1, padding: 16 }}>
            {/* 1. Background Selection */}
            <BackgroundPicker />

            <View style={{ height: 25 }} />

            {/* 2. Upload Section Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>CAR PHOTOS</Text>
                {hasImages && !isProcessing && (
                    <TouchableOpacity onPress={() => clearAllImages()}>
                        <Text style={{ color: '#ff4444', fontSize: 14 }}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 3. Progress Bar */}
            {isProcessing && (
                <View style={{ backgroundColor: '#222', borderRadius: 8, padding: 12, marginBottom: 15 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text style={{ color: '#C9A84C', fontSize: 12 }}>Processing AI Magic...</Text>
                        <Text style={{ color: '#C9A84C', fontSize: 12 }}>{processingProgress}%</Text>
                    </View>
                    <View style={{ height: 4, backgroundColor: '#333', borderRadius: 2 }}>
                        <View style={{ height: 4, backgroundColor: '#C9A84C', borderRadius: 2, width: `${processingProgress}%` }} />
                    </View>
                </View>
            )}

            {/* 4. Images Grid */}
            <View style={{ gap: 10 }}>
                {images.map((img) => (
                    <ImageCard key={img.id} image={img} />
                ))}

                {!isProcessing && (
                    <TouchableOpacity 
                        onPress={pickImages}
                        style={{ height: 100, borderStyle: 'dashed', borderWidth: 1, borderColor: '#444', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}
                    >
                        <Ionicons name="camera-outline" size={24} color="#666" />
                        <Text style={{ color: '#666', marginTop: 8 }}>Add Photos</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 5. Fixed Enhance Button */}
            {pendingImages.length > 0 && !isProcessing && (
                <TouchableOpacity 
                    onPress={processAllImages}
                    style={{ backgroundColor: '#C9A84C', padding: 18, borderRadius: 12, marginTop: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}
                >
                    <Ionicons name="sparkles" size={20} color="#000" />
                    <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>ENHANCE {pendingImages.length} PHOTOS</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

