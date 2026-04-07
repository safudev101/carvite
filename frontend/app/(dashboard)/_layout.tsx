import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type TabIconProps = {
    name: keyof typeof Ionicons.glyphMap;
    focused: boolean;
    label: string;
};

const TabIcon: React.FC<TabIconProps> = ({ name, focused, label }) => (
    <View style={{ alignItems: 'center', gap: 3, paddingTop: 4 }}>
        <Ionicons
            name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
            size={22}
            color={focused ? '#C9A84C' : '#6B7280'}
        />
        <Text
            style={{
                fontSize: 10,
                fontWeight: focused ? '700' : '500',
                color: focused ? '#C9A84C' : '#6B7280',
                letterSpacing: 0.5,
            }}
        >
            {label}
        </Text>
    </View>
);

export default function DashboardLayout() {
    const { isDark } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: isDark ? '#0D0D0D' : '#FFFFFF',
                    borderTopColor: isDark ? '#1E1E1E' : '#E5E7EB',
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 84 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
                    paddingTop: 8,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="flash" focused={focused} label="Studio" />
                    ),
                }}
            />
            <Tabs.Screen
                name="gallery"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="images" focused={focused} label="Gallery" />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="settings" focused={focused} label="Settings" />
                    ),
                }}
            />
        </Tabs>
    );
}