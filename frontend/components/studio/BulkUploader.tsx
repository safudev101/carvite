import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useStudioStore } from '@/stores/studioStore';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { BackgroundPicker } from './BackgroundPicker';
import { ImageCard } from './ImageCard';

export const BulkUploader = () => {
    const { images, addImages, clearAllImages, isProcessing } = useStudioStore();
    const { processAllImages } = useImageProcessor();

    // --- DOWNLOAD LOGIC ---
    const downloadImage = async (uri: string) => {
        try {
            if (Platform.OS === 'web') {
                const link = document.createElement('a');
                link.href = uri;
                link.download = `autovisio_${Date.now()}.png`;
                link.click();
            } else {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status === 'granted') {
                    const asset = await MediaLibrary.createAssetAsync(uri);
                    await MediaLibrary.createAlbumAsync('AutoVisio', asset, false);
                    alert('Saved to Gallery!');
                }
            }
        } catch (err) {
            alert('Download failed!');
        }
    };

    const pickImages = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            const newImages = result.assets.map(asset => ({
                id: Math.random().toString(36),
                uri: asset.uri,
                status: 'idle',
            }));
            addImages(newImages);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* 1. CUSTOM NAV BAR (Carmera Style) */}
            <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', px: 20, borderBottomWidth: 1, borderBottomColor: '#222', backgroundColor: '#000', paddingHorizontal: 15 }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>AutoVisio <Text style={{ color: '#C9A84C' }}>Studio</Text></Text>
                <View style={{ flexDirection: 'row', gap: 15 }}>
                    <Ionicons name="grid-outline" size={22} color="#fff" />
                    <Ionicons name="person-circle-outline" size={24} color="#fff" />
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 15 }}>
                {/* 2. BACKGROUND SELECTOR (No Duplicates) */}
                <Text style={{ color: '#666', fontSize: 12, marginBottom: 10, fontWeight: 'bold' }}>CHOOSE BACKGROUND</Text>
                <BackgroundPicker />

                <View style={{ height: 30 }} />

                {/* 3. UPLOAD QUEUE HEADER */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>CAR PHOTOS ({images.length})</Text>
                    {images.length > 0 && !isProcessing && (
                        <TouchableOpacity onPress={clearAllImages}>
                            <Text style={{ color: '#FF4444', fontWeight: 'bold' }}>Clear All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* 4. RESPONSIVE GRID */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {images.map((img) => (
                        <View key={img.id} style={{ width: '48%', marginBottom: 15 }}>
                            <ImageCard image={img} onDownload={() => downloadImage(img.resultUri!)} />
                        </View>
                    ))}
                    
                    {/* Add Button as a Card */}
                    <TouchableOpacity onPress={pickImages} style={{ width: '48%', height: 120, backgroundColor: '#111', borderRadius: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="add" size={30} color="#C9A84C" />
                        <Text style={{ color: '#666', fontSize: 12 }}>Add Photo</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* 5. FLOATING ENHANCE BUTTON */}
            {images.length > 0 && !isProcessing && (
                <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                    <TouchableOpacity 
                        onPress={processAllImages}
                        style={{ backgroundColor: '#C9A84C', padding: 18, borderRadius: 15, alignItems: 'center', shadowColor: '#C9A84C', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
                    >
                        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>ENHANCE ALL IMAGES</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

// import React from 'react';
// import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import { useStudioStore } from '@/stores/studioStore';
// import { useImageProcessor } from '@/hooks/useImageProcessor';
// import { BackgroundPicker } from './BackgroundPicker';
// import { ImageCard } from './ImageCard';

// export const BulkUploader: React.FC = () => {
//     const { width } = useWindowDimensions();
//     const { images, addImages, clearAllImages, isProcessing, processingProgress } = useStudioStore();
//     const { processAllImages } = useImageProcessor();

//     // ─── RESPONSIVE DESIGN LOGIC ───
//     const isWeb = Platform.OS === 'web';
//     // Web/iPad par max width 800px rakhenge taake design bhadda na lagay
//     const containerStyle = isWeb && width > 800 ? {
//         maxWidth: 800,
//         alignSelf: 'center' as const,
//         width: '100%'
//     } : { flex: 1 };

//     const pickImages = async () => {
//         let result = await ImagePicker.launchImageLibraryAsync({
//             mediaTypes: ImagePicker.MediaTypeOptions.Images,
//             allowsMultipleSelection: true,
//             quality: 1,
//         });

//         if (!result.canceled) {
//             const newImages = result.assets.map((asset) => ({
//                 id: `img_${Date.now()}_${Math.random()}`,
//                 uri: asset.uri,
//                 fileName: asset.fileName || `car.jpg`,
//                 status: 'idle',
//             }));
//             addImages(newImages);
//         }
//     };

//     const hasImages = images.length > 0;
//     const pendingImages = images.filter(img => img.status === 'idle' || img.status === 'error');

//     return (
//         <ScrollView style={{ flex: 1, padding: 16 }}>
//             {/* Wrapper for Responsiveness */}
//             <View style={containerStyle}>
                
//                 {/* 1. Background Selection */}
//                 {/* Note: Agar double background picker aa raha hai, toh check karo parent file mein bhi to nahi laga hua? */}
//                 <BackgroundPicker />

//                 <View style={{ height: 25 }} />

//                 {/* 2. Upload Section Header */}
//                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
//                     <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>CAR PHOTOS</Text>
//                     {hasImages && !isProcessing && (
//                         <TouchableOpacity onPress={() => clearAllImages()} style={{ padding: 5 }}>
//                             <Text style={{ color: '#ff4444', fontSize: 14, fontWeight: '600' }}>Clear All</Text>
//                         </TouchableOpacity>
//                     )}
//                 </View>

//                 {/* 3. Progress Bar */}
//                 {isProcessing && (
//                     <View style={{ backgroundColor: '#222', borderRadius: 8, padding: 16, marginBottom: 15 }}>
//                         <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
//                             <Text style={{ color: '#C9A84C', fontSize: 14, fontWeight: '500' }}>AI Magic Processing...</Text>
//                             <Text style={{ color: '#C9A84C', fontSize: 14, fontWeight: 'bold' }}>{processingProgress}%</Text>
//                         </View>
//                         <View style={{ height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' }}>
//                             <View style={{ height: '100%', backgroundColor: '#C9A84C', width: `${processingProgress}%` }} />
//                         </View>
//                     </View>
//                 )}

//                 {/* 4. Images Grid */}
//                 <View style={{ gap: 12 }}>
//                     {images.map((img) => (
//                         <ImageCard key={img.id} image={img} />
//                     ))}

//                     {!isProcessing && (
//                         <TouchableOpacity 
//                             onPress={pickImages}
//                             style={{ 
//                                 height: 120, 
//                                 borderStyle: 'dashed', 
//                                 borderWidth: 1.5, 
//                                 borderColor: '#444', 
//                                 borderRadius: 12, 
//                                 justifyContent: 'center', 
//                                 alignItems: 'center', 
//                                 backgroundColor: '#1A1A1A' 
//                             }}
//                         >
//                             <Ionicons name="camera-outline" size={32} color="#888" />
//                             <Text style={{ color: '#888', marginTop: 10, fontSize: 16 }}>Tap to Add Car Photos</Text>
//                         </TouchableOpacity>
//                     )}
//                 </View>

//                 {/* 5. Fixed Enhance Button */}
//                 {pendingImages.length > 0 && !isProcessing && (
//                     <TouchableOpacity 
//                         onPress={processAllImages}
//                         style={{ 
//                             backgroundColor: '#C9A84C', 
//                             padding: 20, 
//                             borderRadius: 12, 
//                             marginTop: 25, 
//                             marginBottom: 40,
//                             flexDirection: 'row', 
//                             justifyContent: 'center', 
//                             alignItems: 'center', 
//                             gap: 10,
//                             elevation: 5,
//                             shadowColor: '#C9A84C',
//                             shadowOffset: { width: 0, height: 4 },
//                             shadowOpacity: 0.3,
//                             shadowRadius: 5,
//                         }}
//                     >
//                         <Ionicons name="sparkles" size={24} color="#000" />
//                         <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 18 }}>
//                             ENHANCE {pendingImages.length} {pendingImages.length === 1 ? 'PHOTO' : 'PHOTOS'}
//                         </Text>
//                     </TouchableOpacity>
//                 )}
//             </View>
//         </ScrollView>
//     );
// };


// // import React from 'react';
// // import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
// // import { Ionicons } from '@expo/vector-icons';
// // import * as ImagePicker from 'expo-image-picker';
// // import { useStudioStore } from '@/stores/studioStore';
// // import { useImageProcessor } from '@/hooks/useImageProcessor';
// // import { BackgroundPicker } from './BackgroundPicker';
// // import { ImageCard } from './ImageCard';

// // export const BulkUploader: React.FC = () => {
// //     const { images, addImages, clearAllImages, isProcessing, processingProgress } = useStudioStore();
// //     const { processAllImages } = useImageProcessor();

// //     const pickImages = async () => {
// //         let result = await ImagePicker.launchImageLibraryAsync({
// //             mediaTypes: ImagePicker.MediaTypeOptions.Images,
// //             allowsMultipleSelection: true,
// //             quality: 1,
// //         });

// //         if (!result.canceled) {
// //             const newImages = result.assets.map((asset) => ({
// //                 id: `img_${Date.now()}_${Math.random()}`,
// //                 uri: asset.uri,
// //                 fileName: asset.fileName || `car.jpg`,
// //                 status: 'idle',
// //             }));
// //             addImages(newImages);
// //         }
// //     };

// //     const hasImages = images.length > 0;
// //     const pendingImages = images.filter(img => img.status === 'idle' || img.status === 'error');

// //     return (
// //         <ScrollView style={{ flex: 1, padding: 16 }}>
// //             {/* 1. Background Selection */}
// //             <BackgroundPicker />

// //             <View style={{ height: 25 }} />

// //             {/* 2. Upload Section Header */}
// //             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
// //                 <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>CAR PHOTOS</Text>
// //                 {hasImages && !isProcessing && (
// //                     <TouchableOpacity onPress={() => clearAllImages()}>
// //                         <Text style={{ color: '#ff4444', fontSize: 14 }}>Clear All</Text>
// //                     </TouchableOpacity>
// //                 )}
// //             </View>

// //             {/* 3. Progress Bar */}
// //             {isProcessing && (
// //                 <View style={{ backgroundColor: '#222', borderRadius: 8, padding: 12, marginBottom: 15 }}>
// //                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
// //                         <Text style={{ color: '#C9A84C', fontSize: 12 }}>Processing AI Magic...</Text>
// //                         <Text style={{ color: '#C9A84C', fontSize: 12 }}>{processingProgress}%</Text>
// //                     </View>
// //                     <View style={{ height: 4, backgroundColor: '#333', borderRadius: 2 }}>
// //                         <View style={{ height: 4, backgroundColor: '#C9A84C', borderRadius: 2, width: `${processingProgress}%` }} />
// //                     </View>
// //                 </View>
// //             )}

// //             {/* 4. Images Grid */}
// //             <View style={{ gap: 10 }}>
// //                 {images.map((img) => (
// //                     <ImageCard key={img.id} image={img} />
// //                 ))}

// //                 {!isProcessing && (
// //                     <TouchableOpacity 
// //                         onPress={pickImages}
// //                         style={{ height: 100, borderStyle: 'dashed', borderWidth: 1, borderColor: '#444', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}
// //                     >
// //                         <Ionicons name="camera-outline" size={24} color="#666" />
// //                         <Text style={{ color: '#666', marginTop: 8 }}>Add Photos</Text>
// //                     </TouchableOpacity>
// //                 )}
// //             </View>

// //             {/* 5. Fixed Enhance Button */}
// //             {pendingImages.length > 0 && !isProcessing && (
// //                 <TouchableOpacity 
// //                     onPress={processAllImages}
// //                     style={{ backgroundColor: '#C9A84C', padding: 18, borderRadius: 12, marginTop: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}
// //                 >
// //                     <Ionicons name="sparkles" size={20} color="#000" />
// //                     <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>ENHANCE {pendingImages.length} PHOTOS</Text>
// //                 </TouchableOpacity>
// //             )}
// //         </ScrollView>
// //     );
// // };

