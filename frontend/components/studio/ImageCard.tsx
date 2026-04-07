import React, { useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Animated,
    Pressable,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { LocalImage, ImageStatus } from '../../types';

interface ImageCardProps {
    image: LocalImage;
    isSelected: boolean;
    onSelect: () => void;
    onRemove: () => void;
    onDownload?: () => void;
}

const statusConfig: Record<ImageStatus, { label: string; variant: 'neutral' | 'gold' | 'success' | 'error' | 'info' }> = {
    idle: { label: 'Queued', variant: 'neutral' },
    uploading: { label: 'Uploading', variant: 'info' },
    processing: { label: 'Processing', variant: 'gold' },
    done: { label: 'Done', variant: 'success' },
    error: { label: 'Failed', variant: 'error' },
};

export const ImageCard: React.FC<ImageCardProps> = ({
    image,
    isSelected,
    onSelect,
    onRemove,
    onDownload,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const status = statusConfig[image.status];
    const isProcessing = image.status === 'processing' || image.status === 'uploading';

    return (
        <Animated.View
            style={{
                transform: [{ scale: scaleAnim }],
                width: Platform.OS === 'web' ? 220 : '48%',
                marginBottom: 16,
            }}
        >
            <Pressable
                onPress={onSelect}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    borderWidth: 2,
                    borderColor: isSelected ? '#C9A84C' : 'rgba(255,255,255,0.08)',
                    backgroundColor: '#111',
                    shadowColor: isSelected ? '#C9A84C' : '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSelected ? 0.35 : 0.2,
                    shadowRadius: 10,
                    elevation: 5,
                }}
            >
                {/* Image Preview */}
                <View style={{ position: 'relative', aspectRatio: 4 / 3 }}>
                    <Image
                        source={{ uri: image.processedUri || image.uri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />

                    {/* Processing overlay */}
                    {isProcessing && (
                        <View
                            style={{
                                ...StyleSheet.absoluteFillObject,
                                backgroundColor: 'rgba(0,0,0,0.65)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Spinner size={28} color="#C9A84C" />
                            <Text style={{ color: '#C9A84C', fontSize: 11, marginTop: 8, fontWeight: '600' }}>
                                {image.status === 'uploading' ? 'Uploading…' : 'Enhancing…'}
                            </Text>
                        </View>
                    )}

                    {/* Selection check */}
                    {isSelected && !isProcessing && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                backgroundColor: '#C9A84C',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons name="checkmark" size={13} color="#000" />
                        </View>
                    )}

                    {/* Remove button */}
                    <TouchableOpacity
                        onPress={onRemove}
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.15)',
                        }}
                    >
                        <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>

                    {/* Progress bar */}
                    {isProcessing && (
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                            }}
                        >
                            <View
                                style={{
                                    width: '30%',
                                    height: '100%',
                                    backgroundColor: '#C9A84C',
                                }}
                            />
                        </View>
                    )}
                </View>

                {/* Card Footer */}
                <View
                    style={{
                        padding: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#0D0D0D',
                    }}
                >
                    <Badge label={status.label} variant={status.variant} size="sm" />

                    {image.status === 'done' && onDownload && (
                        <TouchableOpacity onPress={onDownload}>
                            <Ionicons name="download-outline" size={18} color="#C9A84C" />
                        </TouchableOpacity>
                    )}

                    {image.status === 'error' && (
                        <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
};

// avoid import error on older RN
const StyleSheet = { absoluteFillObject: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 } };