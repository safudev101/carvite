import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'glass' | 'dark' | 'gold';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'default',
    padding = 'md',
}) => {
    const { isDark } = useTheme();

    const paddingMap = {
        none: 0,
        sm: 12,
        md: 20,
        lg: 28,
    };

    const variantStyles: ViewStyle = {
        default: {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderColor: isDark ? '#2A2A2A' : '#E5E5E5',
            borderWidth: 1,
        },
        glass: {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            borderWidth: 1,
        },
        dark: {
            backgroundColor: '#0D0D0D',
            borderColor: '#2A2A2A',
            borderWidth: 1,
        },
        gold: {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFDF5',
            borderColor: '#C9A84C',
            borderWidth: 1,
        },
    }[variant];

    return (
        <View
            style={[
                {
                    borderRadius: 16,
                    padding: paddingMap[padding],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.4 : 0.08,
                    shadowRadius: 12,
                    elevation: 4,
                },
                variantStyles,
                style,
            ]}
        >
            {children}
        </View>
    );
};