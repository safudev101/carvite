import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    Alert,
    TextInput,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
    getAdminStats,
    getAllUsers,
    updateUserPlan,
    AdminStats,
    DbProfile,
} from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';

// ── Stat Card ──────────────────────────────────────────────────────────────
const StatCard: React.FC<{
    icon: string;
    iconBg: string;
    label: string;
    value: string | number;
    sublabel?: string;
}> = ({ icon, iconBg, label, value, sublabel }) => (
    <Card variant="dark" padding="md" style={{ flex: 1, minWidth: 140 }}>
        <View
            style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
            }}
        >
            <Ionicons name={icon as any} size={18} color="#fff" />
        </View>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 26 }}>{value}</Text>
        <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>{label}</Text>
        {sublabel && (
            <Text style={{ color: '#C9A84C', fontSize: 11, marginTop: 3 }}>{sublabel}</Text>
        )}
    </Card>
);

// ── User Row ───────────────────────────────────────────────────────────────
const UserRow: React.FC<{
    user: DbProfile;
    onChangePlan: (u: DbProfile) => void;
}> = ({ user, onChangePlan }) => (
    <View
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.05)',
            gap: 12,
        }}
    >
        {/* Avatar */}
        <View
            style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: user.is_admin ? '#C9A84C' : '#2A2A2A',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Text style={{ color: user.is_admin ? '#000' : '#9CA3AF', fontWeight: '700', fontSize: 15 }}>
                {(user.full_name ?? user.email)[0].toUpperCase()}
            </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#E5E5E5', fontWeight: '600', fontSize: 13 }} numberOfLines={1}>
                    {user.full_name ?? 'Unnamed'}
                </Text>
                {user.is_admin && (
                    <Badge label="Admin" variant="gold" size="sm" />
                )}
            </View>
            <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 1 }} numberOfLines={1}>
                {user.email}
            </Text>
            <Text style={{ color: '#4B5563', fontSize: 10, marginTop: 1 }}>
                {user.total_images_processed} images · {user.credits_remaining} credits left
            </Text>
        </View>

        {/* Plan badge + change */}
        <TouchableOpacity onPress={() => onChangePlan(user)}>
            <Badge
                label={user.plan}
                variant={user.plan === 'pro' ? 'gold' : user.plan === 'enterprise' ? 'success' : 'neutral'}
            />
        </TouchableOpacity>
    </View>
);

// ── Main Screen ────────────────────────────────────────────────────────────
export default function AdminPanel() {
    const { user: currentUser } = useAuthStore();

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<DbProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<DbProfile[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
    const [page, setPage] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchData = useCallback(async (resetPage = true) => {
        try {
            const currentPage = resetPage ? 0 : page;
            const [statsData, usersData] = await Promise.all([
                getAdminStats(),
                getAllUsers(currentPage, 25),
            ]);
            setStats(statsData);
            if (resetPage) {
                setUsers(usersData);
                setFilteredUsers(usersData);
                setPage(0);
            } else {
                setUsers((prev) => [...prev, ...usersData]);
                setFilteredUsers((prev) => [...prev, ...usersData]);
            }
        } catch (e) {
            console.error('Admin fetchData error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [page]);

    useEffect(() => { fetchData(); }, []);

    // Search filter
    useEffect(() => {
        if (!search.trim()) {
            setFilteredUsers(users);
        } else {
            const q = search.toLowerCase();
            setFilteredUsers(
                users.filter(
                    (u) =>
                        u.email.toLowerCase().includes(q) ||
                        (u.full_name ?? '').toLowerCase().includes(q)
                )
            );
        }
    }, [search, users]);

    const handleChangePlan = (u: DbProfile) => {
        Alert.alert(
            `Change Plan — ${u.full_name ?? u.email}`,
            `Current plan: ${u.plan.toUpperCase()}`,
            [
                {
                    text: '⭐ Set Free',
                    onPress: async () => {
                        await updateUserPlan(u.id, 'free', 10);
                        fetchData();
                    },
                },
                {
                    text: '🏆 Set Pro (500 credits)',
                    onPress: async () => {
                        await updateUserPlan(u.id, 'pro', 500);
                        fetchData();
                    },
                },
                {
                    text: '💎 Set Enterprise (∞)',
                    onPress: async () => {
                        await updateUserPlan(u.id, 'enterprise', 99999);
                        fetchData();
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleLoadMore = async () => {
        setLoadingMore(true);
        setPage((p) => p + 1);
        await fetchData(false);
    };

    const TABS = ['overview', 'users'] as const;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#080808' }}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#0A0A0A', '#0D0D0D']}
                style={{
                    paddingHorizontal: 20,
                    paddingTop: Platform.OS === 'android' ? 48 : 16,
                    paddingBottom: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: '#1A1A1A',
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                                Control Center
                            </Text>
                            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
                                Admin Panel
                            </Text>
                        </View>
                    </View>
                    <Badge label="Admin" variant="gold" />
                </View>

                {/* Tab bar */}
                <View style={{ flexDirection: 'row', gap: 0 }}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={{
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                borderBottomWidth: 2,
                                borderBottomColor: activeTab === tab ? '#C9A84C' : 'transparent',
                            }}
                        >
                            <Text
                                style={{
                                    color: activeTab === tab ? '#C9A84C' : '#6B7280',
                                    fontWeight: '700',
                                    fontSize: 13,
                                    textTransform: 'capitalize',
                                }}
                            >
                                {tab === 'overview' ? '📊 Overview' : `👥 Users${stats ? ` (${stats.total_users})` : ''}`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                    <Spinner size={32} color="#C9A84C" />
                    <Text style={{ color: '#6B7280' }}>Loading admin data…</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchData(); }}
                            tintColor="#C9A84C"
                        />
                    }
                >
                    {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
                    {activeTab === 'overview' && stats && (
                        <View style={{ gap: 16 }}>

                            {/* Primary stats row */}
                            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                                <StatCard
                                    icon="people"
                                    iconBg="#3B82F6"
                                    label="Total Users"
                                    value={stats.total_users}
                                    sublabel={`${stats.free_users} free tier`}
                                />
                                <StatCard
                                    icon="images"
                                    iconBg="#8B5CF6"
                                    label="Total Images"
                                    value={stats.total_images}
                                    sublabel={`${stats.images_today} today`}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                                <StatCard
                                    icon="flash"
                                    iconBg="#C9A84C"
                                    label="Pro Users"
                                    value={stats.pro_users}
                                />
                                <StatCard
                                    icon="person-outline"
                                    iconBg="#22C55E"
                                    label="Free Users"
                                    value={stats.free_users}
                                />
                            </View>

                            {/* Performance card */}
                            <Card variant="dark" padding="md">
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <Ionicons name="speedometer-outline" size={16} color="#C9A84C" />
                                    <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
                                        Performance
                                    </Text>
                                </View>

                                {[
                                    {
                                        label: 'Avg Processing Time',
                                        value: '~2.5s',
                                        icon: 'time-outline',
                                        color: '#60A5FA',
                                    },
                                    {
                                        label: 'Pro Conversion Rate',
                                        value: stats.total_users > 0
                                            ? `${Math.round((stats.pro_users / stats.total_users) * 100)}%`
                                            : '0%',
                                        icon: 'trending-up-outline',
                                        color: '#C9A84C',
                                    },
                                    {
                                        label: 'Images Per User (avg)',
                                        value: stats.total_users > 0
                                            ? (stats.total_images / stats.total_users).toFixed(1)
                                            : '0',
                                        icon: 'analytics-outline',
                                        color: '#A78BFA',
                                    },
                                ].map((item) => (
                                    <View
                                        key={item.label}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            paddingVertical: 10,
                                            borderBottomWidth: 1,
                                            borderBottomColor: 'rgba(255,255,255,0.05)',
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <Ionicons name={item.icon as any} size={16} color={item.color} />
                                            <Text style={{ color: '#9CA3AF', fontSize: 13 }}>{item.label}</Text>
                                        </View>
                                        <Text style={{ color: '#E5E5E5', fontWeight: '700', fontSize: 15 }}>
                                            {item.value}
                                        </Text>
                                    </View>
                                ))}
                            </Card>

                            {/* Quick actions */}
                            <Card variant="dark" padding="md">
                                <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
                                    Quick Actions
                                </Text>
                                {[
                                    { label: 'View All Users', icon: 'people-outline', onPress: () => setActiveTab('users') },
                                    { label: 'Go to Studio', icon: 'flash-outline', onPress: () => router.push('/(dashboard)') },
                                ].map((action) => (
                                    <TouchableOpacity
                                        key={action.label}
                                        onPress={action.onPress}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingVertical: 12,
                                            borderBottomWidth: 1,
                                            borderBottomColor: 'rgba(255,255,255,0.05)',
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <Ionicons name={action.icon as any} size={18} color="#9CA3AF" />
                                            <Text style={{ color: '#E5E5E5', fontSize: 14, fontWeight: '600' }}>
                                                {action.label}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color="#4B5563" />
                                    </TouchableOpacity>
                                ))}
                            </Card>
                        </View>
                    )}

                    {/* ── USERS TAB ────────────────────────────────────────── */}
                    {activeTab === 'users' && (
                        <View style={{ gap: 14 }}>
                            {/* Search */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#111',
                                    borderWidth: 1,
                                    borderColor: '#2A2A2A',
                                    borderRadius: 12,
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                    gap: 10,
                                }}
                            >
                                <Ionicons name="search-outline" size={16} color="#6B7280" />
                                <TextInput
                                    value={search}
                                    onChangeText={setSearch}
                                    placeholder="Search by name or email…"
                                    placeholderTextColor="#4B5563"
                                    style={{ flex: 1, color: '#E5E5E5', fontSize: 14 }}
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                />
                                {search.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearch('')}>
                                        <Ionicons name="close-circle" size={16} color="#6B7280" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* User list */}
                            <Card variant="dark" padding="md">
                                {filteredUsers.length === 0 ? (
                                    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                                        <Ionicons name="people-outline" size={36} color="#374151" />
                                        <Text style={{ color: '#6B7280', marginTop: 10 }}>No users found</Text>
                                    </View>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <UserRow key={u.id} user={u} onChangePlan={handleChangePlan} />
                                    ))
                                )}

                                {/* Load more */}
                                {filteredUsers.length >= 25 && !search && (
                                    <TouchableOpacity
                                        onPress={handleLoadMore}
                                        disabled={loadingMore}
                                        style={{
                                            alignItems: 'center',
                                            paddingVertical: 14,
                                            marginTop: 4,
                                        }}
                                    >
                                        {loadingMore ? (
                                            <ActivityIndicator color="#C9A84C" />
                                        ) : (
                                            <Text style={{ color: '#C9A84C', fontWeight: '600', fontSize: 14 }}>
                                                Load More
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </Card>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}