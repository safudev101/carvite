import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Switch,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    Linking,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useTheme } from '@/hooks/useTheme';

type SettingRowProps = {
    icon: string;
    iconColor?: string;
    label: string;
    sublabel?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    destructive?: boolean;
};

const SettingRow: React.FC<SettingRowProps> = ({
    icon,
    iconColor = '#9CA3AF',
    label,
    sublabel,
    onPress,
    rightElement,
    destructive,
}) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            gap: 14,
        }}
    >
        <View
            style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: destructive
                    ? 'rgba(239,68,68,0.12)'
                    : 'rgba(255,255,255,0.06)',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Ionicons
                name={icon as any}
                size={18}
                color={destructive ? '#EF4444' : iconColor}
            />
        </View>
        <View style={{ flex: 1 }}>
            <Text
                style={{
                    color: destructive ? '#EF4444' : '#E5E5E5',
                    fontSize: 14,
                    fontWeight: '600',
                }}
            >
                {label}
            </Text>
            {sublabel && (
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 1 }}>
                    {sublabel}
                </Text>
            )}
        </View>
        {rightElement ??
            (onPress && (
                <Ionicons name="chevron-forward" size={16} color="#4B5563" />
            ))}
    </TouchableOpacity>
);

const Divider = () => (
    <View
        style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: -4 }}
    />
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Text
        style={{
            color: '#C9A84C',
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 4,
            marginTop: 24,
            paddingLeft: 2,
        }}
    >
        {title}
    </Text>
);

export default function SettingsScreen() {
    const { isDark } = useTheme();
    const { theme, setTheme } = useThemeStore();
    const { user, profile, signOut } = useAuthStore();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    router.replace('/(auth)/login');
                },
            },
        ]);
    };

    const handleChangeTheme = () => {
        Alert.alert('App Theme', 'Choose your preferred appearance', [
            { text: 'Dark (Recommended)', onPress: () => setTheme('dark') },
            { text: 'Light', onPress: () => setTheme('light') },
            { text: 'System', onPress: () => setTheme('system') },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const themeLabel = { dark: 'Dark', light: 'Light', system: 'System' }[theme];
    const bgColor = isDark ? '#080808' : '#F4F4F5';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#0A0A0A', '#111111']}
                style={{
                    paddingHorizontal: 20,
                    paddingTop: Platform.OS === 'android' ? 48 : 16,
                    paddingBottom: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: '#1E1E1E',
                }}
            >
                <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    Preferences
                </Text>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 }}>
                    Settings
                </Text>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <Card variant="dark" padding="md" style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        {/* Avatar */}
                        <View
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: '#C9A84C',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ color: '#000', fontWeight: '800', fontSize: 20 }}>
                                {(profile?.full_name ?? user?.email ?? 'U')[0].toUpperCase()}
                            </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                                {profile?.full_name ?? 'Unknown User'}
                            </Text>
                            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
                                {user?.email}
                            </Text>
                            <Badge
                                label={profile?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                                variant={profile?.plan === 'pro' ? 'gold' : 'neutral'}
                                size="sm"
                                style={{ marginTop: 6 }}
                            />
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: '#C9A84C', fontWeight: '800', fontSize: 18 }}>
                                {profile?.credits_remaining ?? 0}
                            </Text>
                            <Text style={{ color: '#6B7280', fontSize: 10 }}>credits left</Text>
                        </View>
                    </View>

                    {/* Upgrade CTA for free users */}
                    {profile?.plan !== 'pro' && (
                        <TouchableOpacity
                            style={{
                                marginTop: 16,
                                backgroundColor: '#C9A84C',
                                borderRadius: 12,
                                paddingVertical: 12,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <Ionicons name="flash" size={15} color="#000" />
                            <Text style={{ color: '#000', fontWeight: '800', fontSize: 14 }}>
                                Upgrade to Pro — Unlimited Credits
                            </Text>
                        </TouchableOpacity>
                    )}
                </Card>

                {/* Appearance */}
                <SectionHeader title="Appearance" />
                <Card variant="dark" padding="md">
                    <SettingRow
                        icon="moon-outline"
                        iconColor="#818CF8"
                        label="Theme"
                        sublabel={`Currently: ${themeLabel}`}
                        onPress={handleChangeTheme}
                        rightElement={
                            <Badge label={themeLabel} variant="neutral" size="sm" />
                        }
                    />
                </Card>

                {/* Notifications */}
                <SectionHeader title="Notifications" />
                <Card variant="dark" padding="md">
                    <SettingRow
                        icon="notifications-outline"
                        iconColor="#34D399"
                        label="Processing Complete"
                        sublabel="Notify when AI enhancement finishes"
                        rightElement={
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#374151', true: '#C9A84C' }}
                                thumbColor="#fff"
                            />
                        }
                    />
                </Card>

                {/* Privacy */}
                <SectionHeader title="Privacy & Data" />
                <Card variant="dark" padding="md">
                    <SettingRow
                        icon="analytics-outline"
                        iconColor="#60A5FA"
                        label="Usage Analytics"
                        sublabel="Help improve AutoVisio (anonymous)"
                        rightElement={
                            <Switch
                                value={analyticsEnabled}
                                onValueChange={setAnalyticsEnabled}
                                trackColor={{ false: '#374151', true: '#C9A84C' }}
                                thumbColor="#fff"
                            />
                        }
                    />
                    <Divider />
                    <SettingRow
                        icon="shield-checkmark-outline"
                        iconColor="#34D399"
                        label="Privacy Policy"
                        onPress={() => Linking.openURL('https://autovisio.app/privacy')}
                    />
                    <Divider />
                    <SettingRow
                        icon="document-text-outline"
                        iconColor="#9CA3AF"
                        label="Terms of Service"
                        onPress={() => Linking.openURL('https://autovisio.app/terms')}
                    />
                </Card>

                {/* Support */}
                <SectionHeader title="Support" />
                <Card variant="dark" padding="md">
                    <SettingRow
                        icon="help-circle-outline"
                        iconColor="#FBBF24"
                        label="Help Center"
                        onPress={() => Linking.openURL('https://autovisio.app/help')}
                    />
                    <Divider />
                    <SettingRow
                        icon="mail-outline"
                        iconColor="#60A5FA"
                        label="Contact Support"
                        sublabel="support@autovisio.app"
                        onPress={() => Linking.openURL('mailto:support@autovisio.app')}
                    />
                    <Divider />
                    <SettingRow
                        icon="star-outline"
                        iconColor="#FBBF24"
                        label="Rate AutoVisio"
                        onPress={() => { }}
                    />
                </Card>

                {/* Account */}
                <SectionHeader title="Account" />
                <Card variant="dark" padding="md">
                    <SettingRow
                        icon="log-out-outline"
                        label="Sign Out"
                        onPress={handleSignOut}
                        destructive
                    />
                    <Divider />
                    <SettingRow
                        icon="trash-outline"
                        label="Delete Account"
                        sublabel="Permanently remove all your data"
                        onPress={() =>
                            Alert.alert(
                                'Delete Account',
                                'Contact support@autovisio.app to permanently delete your account and all data.',
                                [{ text: 'OK' }]
                            )
                        }
                        destructive
                    />
                </Card>

                {/* App version */}
                <Text
                    style={{
                        color: '#374151',
                        fontSize: 11,
                        textAlign: 'center',
                        marginTop: 28,
                    }}
                >
                    AutoVisio Studio v1.0.0 — Built with ❤️
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}