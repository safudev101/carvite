import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    RefreshControl,
    Platform,
    Share,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../services/supabase';
import { CarImage } from '../../types';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');

type SortOption = 'newest' | 'oldest';

export default function GalleryScreen() {
    const { isDark } = useTheme();
    const { user } = useAuthStore();

    const [images, setImages] = useState<CarImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sort, setSort] = useState<SortOption>('newest');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    // Responsive Column Logic
    const COLS = SCREEN_W > 768 ? 4 : 2;
    const IMG_SIZE = (SCREEN_W - (16 * (COLS + 1))) / COLS;

    const fetchImages = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('car_images')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('created_at', { ascending: sort === 'oldest' });
            
            if (error) throw error;
            setImages(data ?? []);
        } catch (err) {
            console.error('Gallery fetch error', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, sort]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchImages();
    };

    const handleDownload = async (img: CarImage) => {
        const url = img.processed_url || img.original_url;
        if (!url) return;
        
        setDownloading(img.id);

        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Allow photo library access to save images.');
                return;
            }

            // Download to temporary cache
            const filename = `carvite_${img.id}.png`;
            const fileUri = `${FileSystem.cacheDirectory}${filename}`;
            
            const downloadResult = await FileSystem.downloadAsync(url, fileUri);

            if (downloadResult.status === 200) {
                await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
                Alert.alert('Success ✅', 'Image saved to your gallery.');
            } else {
                throw new Error('Download failed');
            }
        } catch (e) {
            console.error('Download error:', e);
            Alert.alert('Error', 'Could not save image. Please try again.');
        } finally {
            setDownloading(null);
        }
    };

    const handleShare = async (img: CarImage) => {
        const url = img.processed_url || img.original_url;
        if (!url) return;
        try {
            await Share.share({
                url: url,
                message: `Check out my AI-enhanced car photo! 🚗✨`,
            });
        } catch (e) {
            console.error('Share failed', e);
        }
    };

    const handleDelete = (img: CarImage) => {
        Alert.alert(
            'Delete Image',
            'Are you sure? This will permanently remove this creation.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.from('car_images').delete().eq('id', img.id);
                            if (error) throw error;
                            setImages((prev) => prev.filter((i) => i.id !== img.id));
                            if (selectedId === img.id) setSelectedId(null);
                        } catch (e) {
                            Alert.alert('Error', 'Could not delete image.');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: CarImage }) => {
        const isSelected = selectedId === item.id;
        const isDownloading = downloading === item.id;

        return (
            <TouchableOpacity
                onPress={() => setSelectedId(isSelected ? null : item.id)}
                activeOpacity={0.9}
                style={[styles.cardContainer, { width: IMG_SIZE }]}
            >
                <View style={[styles.cardFrame, isSelected && styles.cardSelected]}>
                    <Image
                        source={{ uri: item.processed_url ?? item.original_url }}
                        style={styles.image}
                        resizeMode="cover"
                    />

                    {isSelected && (
                        <View style={styles.overlay}>
                            <TouchableOpacity
                                onPress={() => handleDownload(item)}
                                style={[styles.actionBtn, { backgroundColor: '#C9A84C' }]}
                                disabled={isDownloading}
                            >
                                {isDownloading ? <Spinner size={16} color="#000" /> : <Ionicons name="download" size={20} color="#000" />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleShare(item)}
                                style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                            >
                                <Ionicons name="share-social" size={20} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleDelete(item)}
                                style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                            >
                                <Ionicons name="trash" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Badge for Type */}
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                            {item.processed_url ? 'AI READY' : 'ORIGINAL'}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.infoArea}>
                    <Text style={styles.fileName} numberOfLines={1}>
                        {item.file_name || 'Untitled Project'}
                    </Text>
                    <Text style={styles.fileDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000' : '#F4F4F5' }]}>
            <StatusBar barStyle="light-content" />

            <LinearGradient colors={['#0A0A0A', '#111']} style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.kicker}>STUDIO ARCHIVE</Text>
                        <Text style={styles.title}>Gallery</Text>
                    </View>
                    
                    <TouchableOpacity
                        onPress={() => setSort(s => s === 'newest' ? 'oldest' : 'newest')}
                        style={styles.sortBtn}
                    >
                        <Ionicons name={sort === 'newest' ? 'funnel' : 'funnel-outline'} size={14} color="#C9A84C" />
                        <Text style={styles.sortText}>{sort === 'newest' ? 'Newest' : 'Oldest'}</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <Spinner size={40} color="#C9A84C" />
                    <Text style={styles.statusText}>Syncing your gallery...</Text>
                </View>
            ) : images.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="cloud-offline-outline" size={64} color="#333" />
                    <Text style={styles.emptyTitle}>No Creations Found</Text>
                    <Text style={styles.emptySub}>Processed images will appear here automatically.</Text>
                </View>
            ) : (
                <FlatList
                    data={images}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    numColumns={COLS}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#C9A84C" />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 45 : 10, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    kicker: { color: '#C9A84C', fontSize: 10, fontWeight: '700', letterSpacing: 2 },
    title: { color: '#FFF', fontSize: 32, fontWeight: '900' },
    sortBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: '#333' },
    sortText: { color: '#EEE', fontSize: 12, fontWeight: '600' },
    
    listContainer: { padding: 16 },
    cardContainer: { marginBottom: 20, marginRight: 10 },
    cardFrame: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#111', position: 'relative', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    cardSelected: { borderWidth: 2, borderColor: '#C9A84C' },
    image: { width: '100%', aspectRatio: 1 },
    
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 12 },
    actionBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    
    typeBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    typeBadgeText: { color: '#C9A84C', fontSize: 8, fontWeight: '800' },
    
    infoArea: { marginTop: 8, paddingHorizontal: 4 },
    fileName: { color: '#FFF', fontSize: 13, fontWeight: '600' },
    fileDate: { color: '#666', fontSize: 10, marginTop: 2 },
    
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    statusText: { color: '#666', marginTop: 15, fontSize: 14 },
    emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 20 },
    emptySub: { color: '#555', textAlign: 'center', marginTop: 8, fontSize: 14 }
});
