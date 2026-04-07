import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Image,
    PanResponder,
    Animated,
    LayoutChangeEvent,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BeforeAfterSliderProps {
    beforeUri: string;
    afterUri: string;
    height?: number;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
    beforeUri,
    afterUri,
    height = 300,
}) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const sliderX = useRef(new Animated.Value(0.5)).current; // 0..1
    const [sliderRaw, setSliderRaw] = useState(0.5);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => { },
            onPanResponderMove: (_, gs) => {
                if (containerWidth === 0) return;
                const raw = Math.max(0.03, Math.min(0.97, gs.moveX / containerWidth));
                setSliderRaw(raw);
                sliderX.setValue(raw);
            },
        })
    ).current;

    const handleLayout = (e: LayoutChangeEvent) => {
        setContainerWidth(e.nativeEvent.layout.width);
    };

    const clampedPct = `${Math.round(sliderRaw * 100)}%`;

    return (
        <View
            style={{ borderRadius: 16, overflow: 'hidden', height }}
            onLayout={handleLayout}
            {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
        >
            {/* AFTER (full width underneath) */}
            <Image
                source={{ uri: afterUri }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                resizeMode="cover"
            />

            {/* BEFORE (clipped to left portion) */}
            {containerWidth > 0 && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: containerWidth * sliderRaw,
                        overflow: 'hidden',
                    }}
                >
                    <Image
                        source={{ uri: beforeUri }}
                        style={{ width: containerWidth, height }}
                        resizeMode="cover"
                    />
                </View>
            )}

            {/* Divider line */}
            {containerWidth > 0 && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: containerWidth * sliderRaw - 1,
                        width: 2,
                        backgroundColor: '#C9A84C',
                    }}
                >
                    {/* Handle */}
                    <View
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: -20,
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: '#C9A84C',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.5,
                            shadowRadius: 8,
                            elevation: 8,
                            marginTop: -21,
                        }}
                    >
                        <Ionicons name="swap-horizontal" size={18} color="#000" />
                    </View>
                </View>
            )}

            {/* Labels */}
            <View
                style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                }}
            >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                    BEFORE
                </Text>
            </View>

            <View
                style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: 'rgba(201,168,76,0.85)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                }}
            >
                <Text style={{ color: '#000', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                    AFTER
                </Text>
            </View>

            {/* Percentage indicator */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 12,
                    alignSelf: 'center',
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.3)',
                }}
            >
                <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '600' }}>
                    {clampedPct} ← drag → {`${100 - parseInt(clampedPct)}%`}
                </Text>
            </View>
        </View>
    );
};