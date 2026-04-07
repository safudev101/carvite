import React from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    Pressable,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 
import { PREDEFINED_BACKGROUNDS } from '../../constants/backgrounds';
import { Background } from '../../types';
import { useStudioStore } from '../../stores/studioStore';

export const BackgroundPicker: React.FC = () => {
    const { selectedBackground, selectBackground } = useStudioStore();
    const [activeCategory, setActiveCategory] = React.useState('All');

    const categories = ['All', 'Showroom', 'Outdoor', 'Studio', 'Gradient'];

    // Custom Background Picker Logic
    const pickCustomBackground = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Hamain gallery ka access chahiye custom background ke liye.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const customBg: Background = {
                id: `custom_${Date.now()}`,
                label: 'Custom',
                category: 'Custom',
                thumbnailUrl: asset.uri,
                fullUrl: asset.uri, 
            };
            selectBackground(customBg);
        }
    };

    const filtered =
        activeCategory === 'All'
            ? PREDEFINED_BACKGROUNDS
            : PREDEFINED_BACKGROUNDS.filter(
                (b: Background) => b.category.toLowerCase() === activeCategory.toLowerCase()
            );

    return (
        <View>
            {/* Section Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <Ionicons name="image-outline" size={16} color="#C9A84C" />
                <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 13, marginLeft: 6, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    Background
                </Text>
            </View>

            {/* Category Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => setActiveCategory(cat)}
                        style={{
                            paddingHorizontal: 14,
                            paddingVertical: 6,
                            borderRadius: 20,
                            backgroundColor: activeCategory === cat ? '#C9A84C' : 'rgba(255,255,255,0.07)',
                            borderWidth: 1,
                            borderColor: activeCategory === cat ? '#C9A84C' : 'rgba(255,255,255,0.12)',
                        }}
                    >
                        <Text style={{ color: activeCategory === cat ? '#000' : '#9CA3AF', fontSize: 12, fontWeight: '600' }}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Backgrounds Grid */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
                
                {/* 1. None Option (Original) */}
                <Pressable
                    onPress={() => selectBackground(null)}
                    style={{
                        width: 90, height: 60, borderRadius: 10, borderWidth: 2,
                        borderColor: !selectedBackground ? '#C9A84C' : 'rgba(255,255,255,0.1)',
                        backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Ionicons name="ban-outline" size={20} color="#666" />
                    <Text style={{ color: '#666', fontSize: 10, marginTop: 3 }}>Original</Text>
                </Pressable>

                {/* 2. Custom Upload Option */}
                <Pressable
                    onPress={pickCustomBackground}
                    style={{
                        width: 90, height: 60, borderRadius: 10, borderWidth: 2,
                        borderColor: selectedBackground?.category === 'Custom' ? '#C9A84C' : 'rgba(255,255,255,0.1)',
                        backgroundColor: 'rgba(201, 168, 76, 0.1)', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    {selectedBackground?.category === 'Custom' ? (
                         <Image source={{ uri: selectedBackground.thumbnailUrl }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={20} color="#C9A84C" />
                            <Text style={{ color: '#C9A84C', fontSize: 10, marginTop: 3 }}>Upload</Text>
                        </>
                    )}
                </Pressable>

                {/* 3. Predefined Grid */}
                {filtered.map((bg) => (
                    <BackgroundTile
                        key={bg.id}
                        bg={bg}
                        isSelected={selectedBackground?.id === bg.id}
                        onSelect={() => selectBackground(bg)}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

// Helper Component for Tiles
const BackgroundTile: React.FC<{ bg: Background; isSelected: boolean; onSelect: () => void }> = ({ bg, isSelected, onSelect }) => (
    <Pressable
        onPress={onSelect}
        style={{
            width: 90, height: 60, borderRadius: 10, overflow: 'hidden', borderWidth: 2,
            borderColor: isSelected ? '#C9A84C' : 'rgba(255,255,255,0.08)',
        }}
    >
        <Image source={{ uri: bg.thumbnailUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 3, paddingHorizontal: 5 }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '600' }} numberOfLines={1}>{bg.label}</Text>
        </View>
        {isSelected && (
            <View style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={10} color="#000" />
            </View>
        )}
    </Pressable>
);
