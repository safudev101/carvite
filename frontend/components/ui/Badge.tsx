import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

interface BadgeProps {
    label: string;
    variant?: 'gold' | 'success' | 'error' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'neutral',
    size = 'md',
    style,
}) => {
    const variantConfig = {
        gold: { bg: 'rgba(201,168,76,0.15)', text: '#C9A84C', border: 'rgba(201,168,76,0.4)' },
        success: { bg: 'rgba(34,197,94,0.12)', text: '#22C55E', border: 'rgba(34,197,94,0.3)' },
        error: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', border: 'rgba(239,68,68,0.3)' },
        info: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6', border: 'rgba(59,130,246,0.3)' },
        neutral: { bg: 'rgba(255,255,255,0.06)', text: '#9CA3AF', border: 'rgba(255,255,255,0.1)' },
    }[variant];

    const sizeConfig = {
        sm: { paddingH: 8, paddingV: 3, fontSize: 10 },
        md: { paddingH: 12, paddingV: 5, fontSize: 12 },
    }[size];

    return (
        <View
            style={[
                {
                    backgroundColor: variantConfig.bg,
                    borderColor: variantConfig.border,
                    borderWidth: 1,
                    borderRadius: 100,
                    paddingHorizontal: sizeConfig.paddingH,
                    paddingVertical: sizeConfig.paddingV,
                    alignSelf: 'flex-start',
                },
                style,
            ]}
        >
            <Text
                style={{
                    color: variantConfig.text,
                    fontSize: sizeConfig.fontSize,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                }}
            >
                {label}
            </Text>
        </View>
    );
};