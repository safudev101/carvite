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
                    // ✅ FIXED: Mobile par properly width allocate hogi
                    width: Platform.OS === 'web' 
                        ? (isMobile ? (screenWidth - 40) : 260) 
                        : (screenWidth / 2) - 16,
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
                        // ✅ FIXED: 'contain' taake car kabhi na kategi
                        resizeMode="contain"
                    />

                    {isProcessing && (
                        <View style={styles.overlay}>
                            <Spinner size={isMobile ? 22 : 28} color="#C9A84C" />
                            <Text style={[styles.processingText, { fontSize: isMobile ? 9 : 11 }]}>
                                {image.status === 'uploading' ? 'Uploading…' : 'Processing AI…'}
                            </Text>
                        </View>
                    )}

                    {!isProcessing && (
                        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
                            <Ionicons name="close" size={isMobile ? 12 : 14} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={{ flex: 1, marginRight: 4 }}>
                        <Badge label={status.label} variant={status.variant} size="sm" />
                    </View>

                    {image.status === 'done' && (
                        <TouchableOpacity 
                            onPress={onDownload}
                            style={styles.downloadBtn}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="cloud-download" size={isMobile ? 14 : 18} color="#000" />
                            <Text style={[styles.downloadText, { fontSize: isMobile ? 9 : 10 }]}>SAVE</Text>
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
        marginBottom: 12,
        marginHorizontal: 6,
    },
    pressableCard: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1.5,
        backgroundColor: '#111',
        elevation: 3,
    },
    imageContainer: {
        width: '100%',
        // ✅ FIXED: 16/9 widescreen car shots ke liye best hai
        aspectRatio: 16 / 9,
        backgroundColor: '#0A0A0A',
        position: 'relative',
        overflow: 'hidden'
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    processingText: {
        color: '#C9A84C',
        marginTop: 6,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    removeBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    footer: {
    // 1. Aapka asli color
    backgroundColor: '#0D0D0D', 
    
    // 2. Aapki asli settings
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 45,
    paddingHorizontal: 8,
    paddingVertical: 6,

    // 3. Layout fix (Portrait overlapping ke liye zaroori)
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
},

    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#C9A84C',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 3,
    },
    downloadText: {
        color: '#000',
        fontWeight: 'bold',
    }
});
