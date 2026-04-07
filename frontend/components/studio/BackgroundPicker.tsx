import React from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PREDEFINED_BACKGROUNDS } from '../../constants/backgrounds';
import { Background } from '../../types';
import { useStudioStore } from '../../stores/studioStore';

export const BackgroundPicker: React.FC = () => {
    const { selectedBackground, selectBackground } = useStudioStore();

    const categories = ['All', 'Showroom', 'Outdoor', 'Studio', 'Gradient'];

    const [activeCategory, setActiveCategory] = React.useState('All');

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
                <Text
                    style={{
                        color: '#C9A84C',
                        fontWeight: '700',
                        fontSize: 13,
                        marginLeft: 6,
                        letterSpacing: 1.2,
                        textTransform: 'uppercase',
                    }}
                >
                    Background
                </Text>
            </View>

            {/* Category Pills */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 14 }}
                contentContainerStyle={{ gap: 8 }}
            >
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => setActiveCategory(cat)}
                        style={{
                            paddingHorizontal: 14,
                            paddingVertical: 6,
                            borderRadius: 20,
                            backgroundColor:
                                activeCategory === cat
                                    ? '#C9A84C'
                                    : 'rgba(255,255,255,0.07)',
                            borderWidth: 1,
                            borderColor:
                                activeCategory === cat
                                    ? '#C9A84C'
                                    : 'rgba(255,255,255,0.12)',
                        }}
                    >
                        <Text
                            style={{
                                color: activeCategory === cat ? '#000' : '#9CA3AF',
                                fontSize: 12,
                                fontWeight: '600',
                            }}
                        >
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Backgrounds Grid */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 4 }}
            >
                {/* None option */}
                <Pressable
                    onPress={() => selectBackground(null)}
                    style={{
                        width: 90,
                        height: 60,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: !selectedBackground
                            ? '#C9A84C'
                            : 'rgba(255,255,255,0.1)',
                        backgroundColor: '#1A1A1A',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}
                >
                    <Ionicons name="ban-outline" size={20} color="#666" />
                    <Text style={{ color: '#666', fontSize: 10, marginTop: 3 }}>Original</Text>
                </Pressable>

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

const BackgroundTile: React.FC<{
    bg: Background;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ bg, isSelected, onSelect }) => {
    return (
        <Pressable
            onPress={onSelect}
            style={{
                width: 90,
                height: 60,
                borderRadius: 10,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: isSelected ? '#C9A84C' : 'rgba(255,255,255,0.08)',
                shadowColor: isSelected ? '#C9A84C' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isSelected ? 0.5 : 0.15,
                shadowRadius: 6,
                elevation: 3,
            }}
        >
            {bg.thumbnailUrl ? (
                <Image
                    source={{ uri: bg.thumbnailUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                />
            ) : (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#1A1A1A',
                    }}
                />
            )}

            {/* Name overlay */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    paddingVertical: 3,
                    paddingHorizontal: 5,
                }}
            >
                <Text
                    style={{ color: '#fff', fontSize: 9, fontWeight: '600' }}
                    numberOfLines={1}
                >
                    {bg.label}
                </Text>
            </View>

            {/* Selected ring */}
            {isSelected && (
                <View
                    style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: '#C9A84C',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="checkmark" size={10} color="#000" />
                </View>
            )}
        </Pressable>
    );
};