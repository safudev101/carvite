import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { BulkUploader } from '@/components/studio/BulkUploader';
import { BeforeAfterSlider } from '@/components/studio/BeforeAfterSlider';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

import { useStudioStore } from '@/stores/studioStore';
import { useAuthStore } from '@/stores/authStore';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { useTheme } from '@/hooks/useTheme';

export default function StudioDashboard() {
    const { isDark } = useTheme();
    const { user, profile } = useAuthStore();
    const { images, clearAll } = useStudioStore();
    const { processAllImages, isProcessing } = useImageProcessor();

    const scrollRef = useRef<ScrollView>(null);

    const completedImages = images.filter((i) => i.status === 'done');
    const hasCompleted = completedImages.length > 0;
    const latestCompleted = completedImages[completedImages.length - 1];

    const bgColor = isDark ? '#000000' : '#F4F4F5';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* ── TOP HEADER (Keeping your branding) ── */}
                <LinearGradient
                    colors={['#0A0A0A', '#111111']}
                    style={{
                        paddingHorizontal: 20,
                        paddingTop: Platform.OS === 'android' ? 45 : 10,
                        paddingBottom: 25,
                        borderBottomWidth: 1,
                        borderBottomColor: '#1E1E1E',
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="flash" size={18} color="#000" />
                            </View>
                            <View>
                                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>AutoVisio</Text>
                                <Text style={{ color: '#6B7280', fontSize: 11 }}>AI Photo Studio</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(201,168,76,0.1)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                                <Ionicons name="flash" size={12} color="#C9A84C" />
                                <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 12 }}>{profile?.credits_remaining ?? 0}</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/gallery')}>
                                <Ionicons name="images-outline" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>
                            Hi, {profile?.full_name?.split(' ')[0] ?? 'Creator'}
                        </Text>
                    </View>
                </LinearGradient>

                {/* ── MAIN STUDIO AREA ── */}
                <View style={{ padding: 16, gap: 20, width: '100%', alignitems: 'center'}}>
                    
                    {/* MAZAY KI BAAT:
                        Aapne yahan se BackgroundPicker wala card hata diya hai 
                        kyunke BulkUploader ke andar picker pehle se mojud hai.
                        Is se "Double Background" wala masla hal ho jayega.
                    */}

                    <BulkUploader />

                    {/* Processing Status */}
                    {isProcessing && (
                        <Card variant="gold" padding="md">
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Spinner size={20} color="#C9A84C" />
                                <Text style={{ color: '#C9A84C', fontWeight: '700', flex: 1 }}>AI Enhancement in progress...</Text>
                                <Badge label="Live" variant="gold" />
                            </View>
                        </Card>
                    )}

                    {/* Before / After (Only show when done) */}
                    {hasCompleted && latestCompleted.processedUri && (
                        <Card variant="dark" padding="md">
                            <Text style={{ color: '#C9A84C', fontWeight: '700', marginBottom: 12 }}>LATEST RESULT</Text>
                            <BeforeAfterSlider
                                beforeUri={latestCompleted.uri}
                                afterUri={latestCompleted.processedUri}
                                height={250}
                            />
                        </Card>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// import React, { useState, useRef } from 'react';
// import {
//     View,
//     Text,
//     ScrollView,
//     TouchableOpacity,
//     Animated,
//     Alert,
//     SafeAreaView,
//     StatusBar,
//     Platform,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { router } from 'expo-router';

// import { BulkUploader } from '@/components/studio/BulkUploader';
// import { BackgroundPicker } from '@/components/studio/BackgroundPicker';
// import { BeforeAfterSlider } from '@/components/studio/BeforeAfterSlider';
// import { Card } from '@/components/ui/Card';
// import { Badge } from '@/components/ui/Badge';
// import { Spinner } from '@/components/ui/Spinner';

// import { useStudioStore } from '@/stores/studioStore';
// import { useAuthStore } from '@/stores/authStore';
// import { useImageProcessor } from '@/hooks/useImageProcessor';
// import { useTheme } from '@/hooks/useTheme';

// export default function StudioDashboard() {
//     const { isDark } = useTheme();
//     const { user, profile } = useAuthStore();
//     const { images, selectedBackground, clearAll } = useStudioStore();
//     const { processAllImages, isProcessing, currentJobId } = useImageProcessor();

//     const [showBeforeAfter, setShowBeforeAfter] = useState(false);
//     const scrollRef = useRef<ScrollView>(null);

//     const completedImages = images.filter((i) => i.status === 'done');
//     const hasCompleted = completedImages.length > 0;
//     const latestCompleted = completedImages[completedImages.length - 1];

//     const handleProcess = async () => {
//         if (images.filter((i) => i.status === 'idle').length === 0) {
//             Alert.alert('Nothing to process', 'All images are already processed or in queue.');
//             return;
//         }
//         await processAllImages();
//         if (hasCompleted) {
//             setTimeout(() => {
//                 scrollRef.current?.scrollToEnd({ animated: true });
//                 setShowBeforeAfter(true);
//             }, 500);
//         }
//     };

//     const handleClearAll = () => {
//         Alert.alert(
//             'Clear All Images',
//             'This will remove all images from the studio. Processed results are saved in Gallery.',
//             [
//                 { text: 'Cancel', style: 'cancel' },
//                 {
//                     text: 'Clear',
//                     style: 'destructive',
//                     onPress: clearAll,
//                 },
//             ]
//         );
//     };

//     const bgColor = isDark ? '#080808' : '#F4F4F5';
//     const cardBg = isDark ? '#111111' : '#FFFFFF';

//     return (
//         <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
//             <StatusBar barStyle="light-content" />

//             <ScrollView
//                 ref={scrollRef}
//                 showsVerticalScrollIndicator={false}
//                 contentContainerStyle={{ paddingBottom: 100 }}
//             >
//                 {/* ── TOP HEADER ── */}
//                 <LinearGradient
//                     colors={['#0A0A0A', '#111111']}
//                     style={{
//                         paddingHorizontal: 20,
//                         paddingTop: Platform.OS === 'android' ? 48 : 16,
//                         paddingBottom: 24,
//                         borderBottomWidth: 1,
//                         borderBottomColor: '#1E1E1E',
//                     }}
//                 >
//                     <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
//                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
//                             {/* Logo mark */}
//                             <View
//                                 style={{
//                                     width: 36,
//                                     height: 36,
//                                     borderRadius: 10,
//                                     backgroundColor: '#C9A84C',
//                                     alignItems: 'center',
//                                     justifyContent: 'center',
//                                 }}
//                             >
//                                 <Ionicons name="flash" size={18} color="#000" />
//                             </View>
//                             <View>
//                                 <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 }}>
//                                     AutoVisio
//                                 </Text>
//                                 <Text style={{ color: '#6B7280', fontSize: 11, letterSpacing: 0.5 }}>
//                                     AI Photo Studio
//                                 </Text>
//                             </View>
//                         </View>

//                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
//                             {/* Credits badge */}
//                             <View
//                                 style={{
//                                     flexDirection: 'row',
//                                     alignItems: 'center',
//                                     gap: 5,
//                                     backgroundColor: 'rgba(201,168,76,0.1)',
//                                     borderWidth: 1,
//                                     borderColor: 'rgba(201,168,76,0.3)',
//                                     borderRadius: 20,
//                                     paddingHorizontal: 12,
//                                     paddingVertical: 5,
//                                 }}
//                             >
//                                 <Ionicons name="flash" size={12} color="#C9A84C" />
//                                 <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 12 }}>
//                                     {profile?.credits_remaining ?? 0} credits
//                                 </Text>
//                             </View>

//                             {/* Gallery shortcut */}
//                             <TouchableOpacity onPress={() => router.push('/(dashboard)/gallery')}>
//                                 <Ionicons name="images-outline" size={24} color="#9CA3AF" />
//                             </TouchableOpacity>
//                         </View>
//                     </View>

//                     {/* Welcome text */}
//                     <View style={{ marginTop: 20 }}>
//                         <Text style={{ color: '#C9A84C', fontSize: 12, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>
//                             Welcome back
//                         </Text>
//                         <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>
//                             {profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Creator'}
//                         </Text>
//                     </View>

//                     {/* Quick stats */}
//                     <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
//                         {[
//                             { label: 'Processed', value: profile?.total_images_processed ?? 0, icon: 'checkmark-circle' },
//                             { label: 'This Session', value: completedImages.length, icon: 'flash' },
//                             { label: 'In Queue', value: images.filter((i) => i.status === 'idle').length, icon: 'time' },
//                         ].map((stat) => (
//                             <View
//                                 key={stat.label}
//                                 style={{
//                                     flex: 1,
//                                     backgroundColor: 'rgba(255,255,255,0.04)',
//                                     borderWidth: 1,
//                                     borderColor: 'rgba(255,255,255,0.07)',
//                                     borderRadius: 12,
//                                     padding: 12,
//                                     alignItems: 'center',
//                                 }}
//                             >
//                                 <Ionicons name={stat.icon as any} size={16} color="#C9A84C" />
//                                 <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 4 }}>
//                                     {stat.value}
//                                 </Text>
//                                 <Text style={{ color: '#6B7280', fontSize: 10, marginTop: 1 }}>
//                                     {stat.label}
//                                 </Text>
//                             </View>
//                         ))}
//                     </View>
//                 </LinearGradient>

//                 {/* ── MAIN CONTENT ── */}
//                 <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 20 }}>

//                     {/* Background Picker Card */}
//                     <Card variant="dark" padding="md">
//                         <BackgroundPicker />
//                     </Card>

//                     {/* Upload & Queue Card */}
//                     <Card variant="dark" padding="md">
//                         <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
//                             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
//                                 <Ionicons name="cloud-upload-outline" size={16} color="#C9A84C" />
//                                 <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 13, letterSpacing: 1.1, textTransform: 'uppercase' }}>
//                                     Upload Queue
//                                 </Text>
//                             </View>
//                             {images.length > 0 && (
//                                 <TouchableOpacity onPress={handleClearAll}>
//                                     <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>
//                                         Clear All
//                                     </Text>
//                                 </TouchableOpacity>
//                             )}
//                         </View>
//                         <BulkUploader onProcess={handleProcess} isProcessing={isProcessing} />
//                     </Card>

//                     {/* Processing status indicator */}
//                     {isProcessing && (
//                         <Card variant="gold" padding="md">
//                             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
//                                 <Spinner size={24} color="#C9A84C" />
//                                 <View style={{ flex: 1 }}>
//                                     <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 14 }}>
//                                         AI Enhancement Running
//                                     </Text>
//                                     <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
//                                         Removing background & compositing studio scene…
//                                     </Text>
//                                 </View>
//                                 <Badge label="Live" variant="gold" />
//                             </View>
//                         </Card>
//                     )}

//                     {/* Before / After Preview */}
//                     {hasCompleted && latestCompleted.processedUri && (
//                         <Card variant="dark" padding="md">
//                             <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
//                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
//                                     <Ionicons name="swap-horizontal-outline" size={16} color="#C9A84C" />
//                                     <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 13, letterSpacing: 1.1, textTransform: 'uppercase' }}>
//                                         Before / After
//                                     </Text>
//                                 </View>
//                                 <Badge label="Latest" variant="success" size="sm" />
//                             </View>

//                             <BeforeAfterSlider
//                                 beforeUri={latestCompleted.uri}
//                                 afterUri={latestCompleted.processedUri}
//                                 height={260}
//                             />

//                             <Text style={{ color: '#6B7280', fontSize: 11, textAlign: 'center', marginTop: 10 }}>
//                                 Drag the handle left & right to compare
//                             </Text>
//                         </Card>
//                     )}

//                     {/* Tip card when empty */}
//                     {images.length === 0 && (
//                         <Card variant="glass" padding="md">
//                             <View style={{ flexDirection: 'row', gap: 12 }}>
//                                 <View
//                                     style={{
//                                         width: 40,
//                                         height: 40,
//                                         borderRadius: 20,
//                                         backgroundColor: 'rgba(201,168,76,0.1)',
//                                         alignItems: 'center',
//                                         justifyContent: 'center',
//                                     }}
//                                 >
//                                     <Ionicons name="bulb-outline" size={20} color="#C9A84C" />
//                                 </View>
//                                 <View style={{ flex: 1 }}>
//                                     <Text style={{ color: '#E5E5E5', fontWeight: '700', fontSize: 13, marginBottom: 6 }}>
//                                         Pro Tip
//                                     </Text>
//                                     {[
//                                         'Shoot on a plain white or grey surface for best results',
//                                         'Whole-car shots work better than close-ups',
//                                         'Good lighting = sharper AI output',
//                                     ].map((tip, i) => (
//                                         <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
//                                             <Text style={{ color: '#C9A84C', fontSize: 12 }}>•</Text>
//                                             <Text style={{ color: '#9CA3AF', fontSize: 12, flex: 1 }}>{tip}</Text>
//                                         </View>
//                                     ))}
//                                 </View>
//                             </View>
//                         </Card>
//                     )}
//                 </View>
//             </ScrollView>
//         </SafeAreaView>
//     );
// }
