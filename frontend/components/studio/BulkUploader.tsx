import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useStudioStore } from '@/stores/studioStore';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { BackgroundPicker } from './BackgroundPicker';
import { ImageCard } from './ImageCard';

export const BulkUploader: React.FC = () => {
    const { images, addImages, clearAllImages, isProcessing, processingProgress } = useStudioStore();
    const { processAllImages } = useImageProcessor();

    // --- 1. Image Picker Logic ---
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

    // --- 2. Download Logic ---
    const handleDownload = async (uri: string) => {
        if (Platform.OS === 'web') {
            const link = document.createElement('a');
            link.href = uri;
            link.download = `autovisio_car_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
                const asset = await MediaLibrary.createAssetAsync(uri);
                alert("Saved to Gallery!");
            }
        }
    };

    const pendingImages = images.filter(img => img.status === 'idle' || img.status === 'error');

    return (
        <View style={styles.container}>
            {/* --- CUSTOM NAVIGATION (Carmera.eu Style) --- */}
            <View style={styles.navBar}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}><Text style={styles.logoText}>AV</Text></View>
                    <Text style={styles.brandName}>AutoVisio <Text style={{color: '#C9A84C'}}>Studio</Text></Text>
                </View>
                <View style={styles.navIcons}>
                    <TouchableOpacity style={styles.iconBtn}><Ionicons name="layers-outline" size={20} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><Ionicons name="person-outline" size={20} color="#fff" /></TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* --- BACKGROUND SELECTOR --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SELECT STAGE</Text>
                    <BackgroundPicker />
                </View>

                {/* --- UPLOAD QUEUE --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>VEHICLE PHOTOS ({images.length})</Text>
                        {images.length > 0 && !isProcessing && (
                            <TouchableOpacity onPress={clearAllImages}>
                                <Text style={styles.clearBtn}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* --- PROGRESS BAR --- */}
                    {isProcessing && (
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: `${processingProgress}%` }]} />
                            <Text style={styles.progressText}>Processing AI Magic... {processingProgress}%</Text>
                        </View>
                    )}

                    {/* --- RESPONSIVE GRID --- */}
                    <View style={styles.grid}>
                        {images.map((img) => (
                            <View key={img.id} style={styles.cardWrapper}>
                                <ImageCard 
                                    image={img} 
                                    onDownload={() => img.resultUri && handleDownload(img.resultUri)} 
                                />
                            </View>
                        ))}

                        {/* ADD BUTTON AS CARD */}
                        {!isProcessing && images.length < 10 && (
                            <TouchableOpacity onPress={pickImages} style={styles.addCard}>
                                <Ionicons name="add" size={32} color="#C9A84C" />
                                <Text style={styles.addText}>Add Photo</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* --- FLOATING ENHANCE BUTTON --- */}
            {pendingImages.length > 0 && !isProcessing && (
                <View style={styles.footer}>
                    <TouchableOpacity onPress={processAllImages} style={styles.enhanceBtn}>
                        <Ionicons name="sparkles" size={20} color="#000" style={{marginRight: 8}} />
                        <Text style={styles.enhanceBtnText}>ENHANCE {pendingImages.length} PHOTOS</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    navBar: { 
        height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', backgroundColor: '#000' 
    },
    logoContainer: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { width: 32, height: 32, backgroundColor: '#C9A84C', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    brandName: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    navIcons: { flexDirection: 'row', gap: 12 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20 },
    section: { marginBottom: 30 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { color: '#444', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    clearBtn: { color: '#FF4444', fontSize: 12, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    cardWrapper: { width: Platform.OS === 'web' ? '31%' : '48%', marginBottom: 15 },
    addCard: { 
        width: Platform.OS === 'web' ? '31%' : '48%', height: 150, backgroundColor: '#0A0A0A', 
        borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#222', 
        justifyContent: 'center', alignItems: 'center' 
    },
    addText: { color: '#444', fontSize: 12, marginTop: 8 },
    progressContainer: { height: 40, backgroundColor: '#111', borderRadius: 8, marginBottom: 20, justifyContent: 'center', overflow: 'hidden' },
    progressBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(201, 168, 76, 0.2)' },
    progressText: { textAlign: 'center', color: '#C9A84C', fontSize: 12, fontWeight: 'bold' },
    footer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
    enhanceBtn: { 
        backgroundColor: '#C9A84C', height: 55, borderRadius: 15, flexDirection: 'row', 
        justifyContent: 'center', alignItems: 'center', shadowColor: '#C9A84C', shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 
    },
    enhanceBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});



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

