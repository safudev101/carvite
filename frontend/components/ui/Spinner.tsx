import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, ViewStyle } from 'react-native';

interface SpinnerProps {
    size?: number;
    color?: string;
    style?: ViewStyle;
}

export const Spinner: React.FC<SpinnerProps> = ({
    size = 24,
    color = '#C9A84C',
    style,
}) => {
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const rotate = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[{ width: size, height: size }, style]}>
            <Animated.View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 2.5,
                    borderColor: 'transparent',
                    borderTopColor: color,
                    borderRightColor: color + '60',
                    transform: [{ rotate }],
                }}
            />
        </View>
    );
};