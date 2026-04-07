import React, { useRef } from 'react';
import { TouchableOpacity, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
    size?: number;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 22 }) => {
    const { isDark } = useTheme();
    const { theme, setTheme } = useThemeStore();
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const handleToggle = () => {
        Animated.sequence([
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            rotateAnim.setValue(0);
        });

        setTheme(isDark ? 'light' : 'dark');
    };

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <TouchableOpacity
            onPress={handleToggle}
            activeOpacity={0.75}
            style={{
                width: size + 16,
                height: size + 16,
                borderRadius: (size + 16) / 2,
                backgroundColor: isDark
                    ? 'rgba(201,168,76,0.12)'
                    : 'rgba(0,0,0,0.07)',
                borderWidth: 1,
                borderColor: isDark
                    ? 'rgba(201,168,76,0.3)'
                    : 'rgba(0,0,0,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Animated.View style={{ transform: [{ rotate }] }}>
                <Ionicons
                    name={isDark ? 'sunny-outline' : 'moon-outline'}
                    size={size}
                    color={isDark ? '#C9A84C' : '#374151'}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};