import React, { useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { LocalImage } from '../../types';

interface ImageCardProps {
    image: LocalImage;
    isSelected: boolean;
    onSelect: () => void;
    onRemove: () => void;
    onDownload?: () => void;
}

const statusConfig: any = {
    idle: { label: 'Queued', variant: 'neutral' },
    uploading: { label: 'Uploading', variant: 'info' },
    processing: { label: 'AI Processing', variant: 'gold' },
    done: { label: 'Ready', variant: 'success' },
    error: { label: 'Failed', variant: 'error' },
};

export const ImageCard: React.FC<ImageCardProps> = ({ image, isSelected, onSelect, onRemove, onDownload }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const status = statusConfig[image.status] || statusConfig.idle;
    const isProcessing = image.status === 'processing' || image.status === 'uploading';
    const isDone = image.status === 'done';

    return (
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <Pressable
                onPress={onSelect}
                style={[
                    styles.pressableCard,
                    { borderColor: isSelected ? '#C9A84C' : isDone ? 'rgba(201, 168, 76, 0.3)' : 'rgba(255,255,255,0.1)' }
                ]}
            >
                <View style={styles.imageContainer}>
                    <Image source={{ uri: image.resultUri || image.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    {isProcessing && (
                        <View style={styles.overlay}>
                            <Spinner size={20} color="#C9A84C" />
                        </View>
                    )}
                    {!isProcessing && (
                        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
                            <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.footer}>
                    <Badge label={status.label} variant={status.variant} size="sm" />
                    {isDone && (
                        <TouchableOpacity onPress={onDownload} style={styles.downloadBtn}>
                            <Ionicons name="download" size={12} color="#000" />
                        </TouchableOpacity>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardWrapper: { width: '100%' },
    pressableCard: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', borderWidth: 1.5 },
    imageContainer: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#050505' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
    removeBtn: { position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255, 68, 68, 0.9)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, backgroundColor: '#0D0D0D' },
    downloadBtn: { backgroundColor: '#C9A84C', padding: 6, borderRadius: 6 },
});


