import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function AdminLayout() {
    const { profile, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading && profile && !profile.is_admin) {
            // Non-admins get bounced back to dashboard
            router.replace('/(dashboard)');
        }
    }, [profile, isLoading]);

    if (isLoading) return null;

    if (profile && !profile.is_admin) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080808' }}>
                <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '700' }}>Access Denied</Text>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8 }}>Admin access required.</Text>
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
        </Stack>
    );
}