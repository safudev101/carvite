// import React, { useEffect, useState, useCallback } from 'react';
// import {
//     View,
//     Text,
//     FlatList,
//     Image,
//     TouchableOpacity,
//     SafeAreaView,
//     StatusBar,
//     Alert,
//     RefreshControl,
//     Platform,
//     Share,
//     Dimensions,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import * as MediaLibrary from 'expo-media-library';
// //import * as FileSystem from 'expo-file-system';
// import * as FileSystem from 'expo-file-system';

// import { Card } from '@/components/ui/Card';
// import { Badge } from '@/components/ui/Badge';
// import { Spinner } from '@/components/ui/Spinner';
// import { useAuthStore } from '@/stores/authStore';
// import { supabase } from '@/services/supabase';
// import { CarImage } from '@/types';
// import { useTheme } from '@/hooks/useTheme';

// const { width: SCREEN_W } = Dimensions.get('window');
// const COLS = Platform.OS === 'web' ? 4 : 2;
// const IMG_SIZE = (SCREEN_W - 48) / COLS;

// type SortOption = 'newest' | 'oldest';

// export default function GalleryScreen() {
//     const { isDark } = useTheme();
//     const { user } = useAuthStore();

//     const [images, setImages] = useState<CarImage[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [sort, setSort] = useState<SortOption>('newest');
//     const [selectedId, setSelectedId] = useState<string | null>(null);
//     const [downloading, setDownloading] = useState<string | null>(null);

//     const fetchImages = useCallback(async () => {
//         if (!user) return;
//         try {
//             const { data, error } = await supabase
//                 .from('car_images')
//                 .select('*')
//                 .eq('user_id', user.id)
//                 .eq('status', 'completed')
//                 .order('created_at', { ascending: sort === 'oldest' });
//             if (error) throw error;
//             setImages(data ?? []);
//         } catch (err) {
//             console.error('Gallery fetch error', err);
//         } finally {
//             setLoading(false);
//             setRefreshing(false);
//         }
//     }, [user, sort]);

//     useEffect(() => {
//         fetchImages();
//     }, [fetchImages]);

//     const handleRefresh = () => {
//         setRefreshing(true);
//         fetchImages();
//     };

//     const handleDownload = async (img: CarImage) => {
//         if (!img.processed_url) return;
//         setDownloading(img.id);
//         try {
//             const { status } = await MediaLibrary.requestPermissionsAsync();
//             if (status !== 'granted') {
//                 Alert.alert('Permission Required', 'Allow photo library access to save images.');
//                 return;
//             }
//             const fileUri = `${FileSystem.cacheDirectory}carvite_${img.id}.jpg`;
//             await FileSystem.downloadAsync(img.processed_url, fileUri);
//             await MediaLibrary.saveToLibraryAsync(fileUri);
//             Alert.alert('Saved!', 'Image saved to your photo library.');
//         } catch (e) {
//             Alert.alert('Download Failed', 'Could not download the image. Try again.');
//         } finally {
//             setDownloading(null);
//         }
//     };

//     const handleShare = async (img: CarImage) => {
//         if (!img.processed_url) return;
//         try {
//             await Share.share({
//                 url: img.processed_url,
//                 message: `Check out this AI-enhanced car photo — created with AutoVisio Studio`,
//             });
//         } catch (e) {
//             console.error('Share failed', e);
//         }
//     };

//     const handleDelete = (img: CarImage) => {
//         Alert.alert(
//             'Delete Image',
//             'This will permanently remove this image from your gallery.',
//             [
//                 { text: 'Cancel', style: 'cancel' },
//                 {
//                     text: 'Delete',
//                     style: 'destructive',
//                     onPress: async () => {
//                         await supabase.from('car_images').delete().eq('id', img.id);
//                         setImages((prev) => prev.filter((i) => i.id !== img.id));
//                         if (selectedId === img.id) setSelectedId(null);
//                     },
//                 },
//             ]
//         );
//     };

//     const bgColor = isDark ? '#080808' : '#F4F4F5';

//     const renderItem = ({ item }: { item: CarImage }) => {
//         const isSelected = selectedId === item.id;
//         const isDownloading = downloading === item.id;

//         return (
//             <TouchableOpacity
//                 onPress={() => setSelectedId(isSelected ? null : item.id)}
//                 activeOpacity={0.88}
//                 style={{
//                     width: IMG_SIZE,
//                     marginRight: 12,
//                     marginBottom: 12,
//                 }}
//             >
//                 <View
//                     style={{
//                         borderRadius: 14,
//                         overflow: 'hidden',
//                         borderWidth: 2,
//                         borderColor: isSelected ? '#C9A84C' : 'transparent',
//                         backgroundColor: '#111',
//                         shadowColor: isSelected ? '#C9A84C' : '#000',
//                         shadowOffset: { width: 0, height: 4 },
//                         shadowOpacity: isSelected ? 0.4 : 0.2,
//                         shadowRadius: 10,
//                         elevation: 5,
//                     }}
//                 >
//                     {/* Image */}
//                     <Image
//                         source={{ uri: item.processed_url ?? item.original_url }}
//                         style={{ width: '100%', aspectRatio: 4 / 3 }}
//                         resizeMode="cover"
//                     />

//                     {/* Overlay actions — visible when selected */}
//                     {isSelected && (
//                         <View
//                             style={{
//                                 position: 'absolute',
//                                 inset: 0,
//                                 backgroundColor: 'rgba(0,0,0,0.55)',
//                                 alignItems: 'center',
//                                 justifyContent: 'center',
//                                 flexDirection: 'row',
//                                 gap: 16,
//                             }}
//                         >
//                             <TouchableOpacity
//                                 onPress={() => handleDownload(item)}
//                                 style={actionBtnStyle('#C9A84C')}
//                                 disabled={isDownloading}
//                             >
//                                 {isDownloading ? (
//                                     <Spinner size={16} color="#000" />
//                                 ) : (
//                                     <Ionicons name="download-outline" size={18} color="#000" />
//                                 )}
//                             </TouchableOpacity>

//                             <TouchableOpacity
//                                 onPress={() => handleShare(item)}
//                                 style={actionBtnStyle('#3B82F6')}
//                             >
//                                 <Ionicons name="share-outline" size={18} color="#fff" />
//                             </TouchableOpacity>

//                             <TouchableOpacity
//                                 onPress={() => handleDelete(item)}
//                                 style={actionBtnStyle('#EF4444')}
//                             >
//                                 <Ionicons name="trash-outline" size={18} color="#fff" />
//                             </TouchableOpacity>
//                         </View>
//                     )}

//                     {/* Footer */}
//                     <View
//                         style={{
//                             backgroundColor: '#0D0D0D',
//                             paddingHorizontal: 10,
//                             paddingVertical: 8,
//                         }}
//                     >
//                         <Text style={{ color: '#9CA3AF', fontSize: 10 }} numberOfLines={1}>
//                             {item.file_name ?? 'Untitled'}
//                         </Text>
//                         <Text style={{ color: '#4B5563', fontSize: 9, marginTop: 1 }}>
//                             {new Date(item.created_at).toLocaleDateString()}
//                         </Text>
//                     </View>
//                 </View>
//             </TouchableOpacity>
//         );
//     };

//     return (
//         <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
//             <StatusBar barStyle="light-content" />

//             {/* Header */}
//             <LinearGradient
//                 colors={['#0A0A0A', '#111111']}
//                 style={{
//                     paddingHorizontal: 20,
//                     paddingTop: Platform.OS === 'android' ? 48 : 16,
//                     paddingBottom: 20,
//                     borderBottomWidth: 1,
//                     borderBottomColor: '#1E1E1E',
//                 }}
//             >
//                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
//                     <View>
//                         <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>
//                             Your Work
//                         </Text>
//                         <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 }}>
//                             Gallery
//                         </Text>
//                     </View>

//                     <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
//                         <Badge label={`${images.length} photos`} variant="neutral" />
//                         {/* Sort toggle */}
//                         <TouchableOpacity
//                             onPress={() => setSort((s) => (s === 'newest' ? 'oldest' : 'newest'))}
//                             style={{
//                                 flexDirection: 'row',
//                                 alignItems: 'center',
//                                 gap: 5,
//                                 backgroundColor: 'rgba(255,255,255,0.06)',
//                                 borderWidth: 1,
//                                 borderColor: 'rgba(255,255,255,0.1)',
//                                 borderRadius: 8,
//                                 paddingHorizontal: 12,
//                                 paddingVertical: 6,
//                             }}
//                         >
//                             <Ionicons
//                                 name={sort === 'newest' ? 'arrow-down' : 'arrow-up'}
//                                 size={12}
//                                 color="#9CA3AF"
//                             />
//                             <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '600' }}>
//                                 {sort === 'newest' ? 'Newest' : 'Oldest'}
//                             </Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </LinearGradient>

//             {/* Content */}
//             {loading ? (
//                 <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
//                     <Spinner size={32} color="#C9A84C" />
//                     <Text style={{ color: '#6B7280', fontSize: 14 }}>Loading gallery…</Text>
//                 </View>
//             ) : images.length === 0 ? (
//                 <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
//                     <Ionicons name="images-outline" size={52} color="#374151" />
//                     <Text style={{ color: '#9CA3AF', fontSize: 18, fontWeight: '700' }}>
//                         No images yet
//                     </Text>
//                     <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center' }}>
//                         Process your first car photo in the Studio tab to see it here.
//                     </Text>
//                 </View>
//             ) : (
//                 <FlatList
//                     data={images}
//                     keyExtractor={(item) => item.id}
//                     renderItem={renderItem}
//                     numColumns={COLS}
//                     contentContainerStyle={{ padding: 16 }}
//                     showsVerticalScrollIndicator={false}
//                     refreshControl={
//                         <RefreshControl
//                             refreshing={refreshing}
//                             onRefresh={handleRefresh}
//                             tintColor="#C9A84C"
//                         />
//                     }
//                 />
//             )}
//         </SafeAreaView>
//     );
// }

// const actionBtnStyle = (bg: string) => ({
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: bg,
//     alignItems: 'center' as const,
//     justifyContent: 'center' as const,
//     shadowColor: bg,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.5,
//     shadowRadius: 6,
//     elevation: 4,
// });
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../services/supabase';
import { CarImage } from '../../types';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS = Platform.OS === 'web' ? 4 : 2;
const IMG_SIZE = (SCREEN_W - 48) / COLS;

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

    // FIX: handleDownload with TypeScript bypass
    const handleDownload = async (img: CarImage) => {
        if (!img.processed_url) return;
        setDownloading(img.id);

        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Allow photo library access to save images.');
                return;
            }

            // TypeScript fix using (FileSystem as any)
            const cacheDir = (FileSystem as any).cacheDirectory;
            if (!cacheDir) {
                Alert.alert('Error', 'Cache directory not found');
                return;
            }

            const fileUri = `${cacheDir}carvite_${img.id}.jpg`;

            // Image download process
            const downloadResult = await FileSystem.downloadAsync(img.processed_url, fileUri);

            // Save to Gallery
            await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
            Alert.alert('Saved!', 'Image saved to your photo library.');
        } catch (e) {
            console.error('Download error:', e);
            Alert.alert('Download Failed', 'Could not download the image.');
        } finally {
            setDownloading(null);
        }
    };

    const handleShare = async (img: CarImage) => {
        if (!img.processed_url) return;
        try {
            await Share.share({
                url: img.processed_url,
                message: `Check out this AI-enhanced car photo — created with AutoVisio Studio`,
            });
        } catch (e) {
            console.error('Share failed', e);
        }
    };

    const handleDelete = (img: CarImage) => {
        Alert.alert(
            'Delete Image',
            'This will permanently remove this image from your gallery.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.from('car_images').delete().eq('id', img.id);
                        setImages((prev) => prev.filter((i) => i.id !== img.id));
                        if (selectedId === img.id) setSelectedId(null);
                    },
                },
            ]
        );
    };

    const bgColor = isDark ? '#080808' : '#F4F4F5';

    const renderItem = ({ item }: { item: CarImage }) => {
        const isSelected = selectedId === item.id;
        const isDownloading = downloading === item.id;

        return (
            <TouchableOpacity
                onPress={() => setSelectedId(isSelected ? null : item.id)}
                activeOpacity={0.88}
                style={{
                    width: IMG_SIZE,
                    marginRight: 12,
                    marginBottom: 12,
                }}
            >
                <View
                    style={{
                        borderRadius: 14,
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: isSelected ? '#C9A84C' : 'transparent',
                        backgroundColor: '#111',
                        shadowColor: isSelected ? '#C9A84C' : '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isSelected ? 0.4 : 0.2,
                        shadowRadius: 10,
                        elevation: 5,
                    }}
                >
                    <Image
                        source={{ uri: item.processed_url ?? item.original_url }}
                        style={{ width: '100%', aspectRatio: 4 / 3 }}
                        resizeMode="cover"
                    />

                    {isSelected && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 0, bottom: 0, left: 0, right: 0,
                                backgroundColor: 'rgba(0,0,0,0.55)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                gap: 16,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => handleDownload(item)}
                                style={actionBtnStyle('#C9A84C')}
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <Spinner size={16} color="#000" />
                                ) : (
                                    <Ionicons name="download-outline" size={18} color="#000" />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleShare(item)}
                                style={actionBtnStyle('#3B82F6')}
                            >
                                <Ionicons name="share-outline" size={18} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleDelete(item)}
                                style={actionBtnStyle('#EF4444')}
                            >
                                <Ionicons name="trash-outline" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ backgroundColor: '#0D0D0D', paddingHorizontal: 10, paddingVertical: 8 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 10 }} numberOfLines={1}>
                            {item.file_name ?? 'Untitled'}
                        </Text>
                        <Text style={{ color: '#4B5563', fontSize: 9, marginTop: 1 }}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#0A0A0A', '#111111']}
                style={{
                    paddingHorizontal: 20,
                    paddingTop: Platform.OS === 'android' ? 48 : 16,
                    paddingBottom: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: '#1E1E1E',
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                            Your Work
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 }}>
                            Gallery
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        <Badge label={`${images.length} photos`} variant="neutral" />
                        <TouchableOpacity
                            onPress={() => setSort((s) => (s === 'newest' ? 'oldest' : 'newest'))}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                                backgroundColor: 'rgba(255,255,255,0.06)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: 8,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                            }}
                        >
                            <Ionicons
                                name={sort === 'newest' ? 'arrow-down' : 'arrow-up'}
                                size={12}
                                color="#9CA3AF"
                            />
                            <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '600' }}>
                                {sort === 'newest' ? 'Newest' : 'Oldest'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                    <Spinner size={32} color="#C9A84C" />
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Loading gallery…</Text>
                </View>
            ) : images.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
                    <Ionicons name="images-outline" size={52} color="#374151" />
                    <Text style={{ color: '#9CA3AF', fontSize: 18, fontWeight: '700' }}>No images yet</Text>
                    <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center' }}>
                        Process your first car photo in the Studio tab to see it here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={images}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    numColumns={COLS}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#C9A84C" />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const actionBtnStyle = (bg: string) => ({
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: bg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: bg,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
});