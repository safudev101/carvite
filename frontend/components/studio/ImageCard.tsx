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

const { width: screenWidth } = Dimensions.get("window");
const isMobile = screenWidth < 768;

const statusConfig: Record<ImageStatus, { label: string; variant: 'neutral' | 'gold' | 'success' | 'error' | 'info' }> = {
    idle: { label: 'Queued', variant: 'neutral' },
    uploading: { label: 'Uploading', variant: 'info' },
    processing: { label: 'AI Processing', variant: 'gold' },
    done: { label: 'Ready', variant: 'success' },
    error: { label: 'Failed', variant: 'error' },
};

// ✅ FIX 1: Checkerboard background component — transparent PNG ke liye
// Jab BG remove hoti hai, image ke peeche yeh pattern dikhta hai
// taake user confirm kar sake ke background sach mein transparent hai
const CheckerboardBackground: React.FC = () => (
    <View style={StyleSheet.absoluteFill}>
        <View style={styles.checkerRow}>
            {Array.from({ length: 20 }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.checkerCell,
                        { backgroundColor: i % 2 === 0 ? '#CCCCCC' : '#999999' },
                    ]}
                />
            ))}
        </View>
        <View style={styles.checkerRow}>
            {Array.from({ length: 20 }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.checkerCell,
                        { backgroundColor: i % 2 !== 0 ? '#CCCCCC' : '#999999' },
                    ]}
                />
            ))}
        </View>
        <View style={styles.checkerRow}>
            {Array.from({ length: 20 }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.checkerCell,
                        { backgroundColor: i % 2 === 0 ? '#CCCCCC' : '#999999' },
                    ]}
                />
            ))}
        </View>
        <View style={styles.checkerRow}>
            {Array.from({ length: 20 }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.checkerCell,
                        { backgroundColor: i % 2 !== 0 ? '#CCCCCC' : '#999999' },
                    ]}
                />
            ))}
        </View>
        <View style={styles.checkerRow}>
            {Array.from({ length: 20 }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.checkerCell,
                        { backgroundColor: i % 2 === 0 ? '#CCCCCC' : '#999999' },
                    ]}
                />
            ))}
        </View>
        <View style={styles.checkerRow}>
            {Array.from({ length: 20 }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.checkerCell,
                        { backgroundColor: i % 2 !== 0 ? '#CCCCCC' : '#999999' },
                    ]}
                />
            ))}
        </View>
    </View>
);

export const ImageCard: React.FC<ImageCardProps> = ({
    image,
    isSelected,
    onSelect,
    onRemove,
    onDownload,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    const status = statusConfig[image.status];
    const isProcessing = image.status === 'processing' || image.status === 'uploading';
    const isDone = image.status === 'done';

    return (
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <Pressable
                onPress={onSelect}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.pressableCard,
                    {
                        borderColor: isSelected ? '#C9A84C' : isDone ? 'rgba(201, 168, 76, 0.3)' : 'rgba(255,255,255,0.1)',
                        borderWidth: isSelected || isDone ? 2 : 1,
                    }
                ]}
            >
                {/* ✅ FIX 1: isDone ho to checkerboard dikhao, warna dark background */}
                <View style={[
                    styles.imageContainer,
                    { backgroundColor: isDone ? 'transparent' : '#050505' }
                ]}>
                    {/* Checkerboard sirf tab dikhega jab image done ho (transparent PNG) */}
                    {isDone && <CheckerboardBackground />}

                    <Image
                        source={{ uri: image.resultUri || image.uri }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="contain"  // ✅ 'cover' ki jagah 'contain' — transparent edges clip na hon
                    />

                    {/* Processing Overlay */}
                    {isProcessing && (
                        <View style={styles.overlay}>
                            <Spinner size={24} color="#C9A84C" />
                            <Text style={styles.processingText}>
                                {image.status === 'uploading' ? 'UPLOADING...' : 'AI WORKING...'}
                            </Text>
                        </View>
                    )}

                    {/* Remove Button - Only if not processing */}
                    {!isProcessing && (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            style={styles.removeBtn}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Footer Section */}
                <View style={styles.footer}>
                    <Badge label={status.label} variant={status.variant} size="sm" />

                    {isDone && (
                        <TouchableOpacity
                            onPress={onDownload}
                            style={styles.downloadBtn}
                        >
                            <Ionicons name="download" size={14} color="#000" />
                            <Text style={styles.downloadText}>SAVE</Text>
                        </TouchableOpacity>
                    )}

                    {image.status === 'error' && (
                        <Ionicons name="alert-circle" size={18} color="#EF4444" />
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardWrapper: {
        width: '100%',
        marginBottom: 8,
    },
    pressableCard: {
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#111',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 4 / 3,
        // backgroundColor dynamically set hota hai upar
    },
    // ✅ Checkerboard styles
    checkerRow: {
        flex: 1,
        flexDirection: 'row',
    },
    checkerCell: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    processingText: {
        color: '#C9A84C',
        marginTop: 8,
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    removeBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(255, 68, 68, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#161616',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#C9A84C',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    downloadText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 10,
    }
});
