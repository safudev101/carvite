import React, { useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ImageCard } from '@/components/studio/ImageCard';
import { useStudioStore } from '../../stores/studioStore';
import { LocalImage } from '../../types';

import {
    validateImageFile,
    compressImage,
    downloadImage,
    formatFileSize,
    generateOutputFileName,
} from "@/services/imageUtils";

interface BulkUploaderProps {
    onProcess: () => void;
    isProcessing: boolean;
}

export const BulkUploader: React.FC<BulkUploaderProps> = ({
    onProcess,
    isProcessing,
}) => {
    const { images, addImages, removeImage, selectImage, selectedImageId } =
        useStudioStore();

    const dropScale = useRef(new Animated.Value(1)).current;

    const animateDrop = () => {
        Animated.sequence([
            Animated.timing(dropScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
            Animated.spring(dropScale, { toValue: 1, useNativeDriver: true }),
        ]).start();
    };
    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please allow photo library access to upload car images.'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.95,
            selectionLimit: 20,
        });

        if (!result.canceled) {
            // --- YE WALA HISSA UPDATE KAREIN ---
            const newImages: any[] = result.assets.map((asset) => ({
                // id: nanoid(),
                uri: asset.uri,
                fileName: asset.fileName ?? `car_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`,
                fileSize: asset.fileSize ?? 0,
                mimeType: asset.mimeType ?? 'image/jpeg',
                status: 'idle', // Aapki types/index.ts ke mutabiq
            }));

            addImages(newImages as any);
            animateDrop();
            // -----------------------------------
        }
    };
    // const pickImages = async () => {
    //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    //     if (status !== 'granted') {
    //         Alert.alert(
    //             'Permission Required',
    //             'Please allow photo library access to upload car images.'
    //         );
    //         return;
    //     }

    //     const result = await ImagePicker.launchImageLibraryAsync({
    //         mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //         allowsMultipleSelection: true,
    //         quality: 0.95,
    //         selectionLimit: 20,
    //     });

    //     if (!result.canceled) {
    //         const newImages = result.assets.map((asset) => ({
    //             uri: asset.uri,
    //             fileName: asset.fileName ?? `car_${Date.now()}_${Math.random().toString(36).slice(2,7)}.jpg`,
    //             fileSize: asset.fileSize ?? 0,
    //             mimeType: asset.mimeType ?? 'image/jpeg',
    //         }));
    //         addImages(newImages);
    //         animateDrop();
    //     }
    // };

    const hasImages = images.length > 0;
    const completedCount = images.filter((i) => i.status === 'done').length;
    const readyCount = images.filter((i) => i.status === 'idle').length;

    return (
        <View>
            {/* Drop Zone */}
            {!hasImages && (
                <Animated.View style={{ transform: [{ scale: dropScale }] }}>
                    <TouchableOpacity
                        onPress={pickImages}
                        activeOpacity={0.8}
                        style={{
                            borderWidth: 2,
                            borderStyle: 'dashed',
                            borderColor: 'rgba(201,168,76,0.4)',
                            borderRadius: 18,
                            backgroundColor: 'rgba(201,168,76,0.04)',
                            paddingVertical: 52,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                        }}
                    >
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: 'rgba(201,168,76,0.12)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons name="cloud-upload-outline" size={30} color="#C9A84C" />
                        </View>
                        <View style={{ alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: '#E5E5E5', fontSize: 16, fontWeight: '700' }}>
                                Upload Car Photos
                            </Text>
                            <Text style={{ color: '#6B7280', fontSize: 13 }}>
                                Tap to select up to 20 images
                            </Text>
                            <Text style={{ color: '#4B5563', fontSize: 11, marginTop: 4 }}>
                                JPG, PNG, HEIC — max 20MB each
                            </Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Toolbar when images exist */}
            {hasImages && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 14,
                    }}
                >
                    <View style={{ gap: 2 }}>
                        <Text style={{ color: '#E5E5E5', fontWeight: '700', fontSize: 15 }}>
                            {images.length} photo{images.length !== 1 ? 's' : ''} queued
                        </Text>
                        {completedCount > 0 && (
                            <Text style={{ color: '#22C55E', fontSize: 12 }}>
                                ✓ {completedCount} enhanced
                            </Text>
                        )}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        {/* Add more */}
                        <TouchableOpacity
                            onPress={pickImages}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 10,
                                backgroundColor: 'rgba(255,255,255,0.07)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.12)',
                            }}
                        >
                            <Ionicons name="add" size={16} color="#9CA3AF" />
                            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600' }}>
                                Add
                            </Text>
                        </TouchableOpacity>

                        {/* Process button */}
                        {readyCount > 0 && (
                            <TouchableOpacity
                                onPress={onProcess}
                                disabled={isProcessing}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    paddingHorizontal: 18,
                                    paddingVertical: 8,
                                    borderRadius: 10,
                                    backgroundColor: isProcessing ? '#5a4a20' : '#C9A84C',
                                    opacity: isProcessing ? 0.7 : 1,
                                }}
                            >
                                <Ionicons
                                    name={isProcessing ? 'hourglass-outline' : 'flash'}
                                    size={15}
                                    color="#000"
                                />
                                <Text style={{ color: '#000', fontSize: 13, fontWeight: '700' }}>
                                    {isProcessing ? 'Processing…' : `Enhance ${readyCount}`}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Image Grid */}
            {hasImages && (
                <View
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    {images.map((img) => (
                        <ImageCard
                            key={img.id}
                            image={img}
                            isSelected={selectedImageId === img.id}
                            onSelect={() => selectImage(img.id)}
                            onRemove={() => removeImage(img.id)}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};