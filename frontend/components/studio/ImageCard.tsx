import React, { useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Animated,
    Pressable,
    Platform,
    Dimensions,
    StyleSheet,
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

const { width } = Dimensions.get("window");

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
            style={[
                styles.cardWrapper,
                {
                    transform: [{ scale: scaleAnim }],
                    width: Platform.OS === 'web' ? 240 : (width / 2) - 20,
                }
            ]}
        >
            <Pressable
                onPress={onSelect}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.pressableCard,
                    {
                        borderColor: isSelected ? '#C9A84C' : 'rgba(255,255,255,0.08)',
                        shadowColor: isSelected ? '#C9A84C' : '#000',
                    }
                ]}
            >
                {/* Image Preview */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: image.resultUri || image.uri }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />

                    {isProcessing && (
                        <View style={styles.overlay}>
                            <Spinner size={28} color="#C9A84C" />
                            <Text style={styles.processingText}>
                                {image.status === 'uploading' ? 'Uploading…' : 'Processing AI…'}
                            </Text>
                        </View>
                    )}

                    {!isProcessing && (
                        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
                            <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {image.status === 'done' && (
                        <View style={styles.doneBadge}>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={{ flex: 1 }}>
                        <Badge label={status.label} variant={status.variant} size="sm" />
                    </View>

                    {image.status === 'done' && (
                        <TouchableOpacity 
                            onPress={onDownload}
                            style={styles.downloadBtn}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="cloud-download" size={18} color="#000" />
                            <Text style={styles.downloadText}>SAVE</Text>
                        </TouchableOpacity>
                    )}

                    {image.status === 'error' && (
                        <Ionicons name="alert-circle" size={20} color="#EF4444" />
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 16,
    },
    pressableCard: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 2,
        backgroundColor: '#111',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 4 / 3,
        position: 'relative',
        overflow: 'hidden'
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    processingText: {
        color: '#C9A84C',
        fontSize: 11,
        marginTop: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    removeBtn: {
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
        borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 10,
    },
    doneBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 2,
    },
    footer: {
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0D0D0D',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#C9A84C',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        gap: 4,
    },
    downloadText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    }
});
