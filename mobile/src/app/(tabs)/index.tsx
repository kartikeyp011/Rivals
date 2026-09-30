import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useAdVisibility } from '@/hooks/useAdVisibility';
import { Platform } from 'react-native';

export default function HomeScreen() {
    const [coins, setCoins] = useState(0);
    const [streak, setStreak] = useState(0);
    const [invites, setInvites] = useState<any[]>([]);
    const [globalRank, setGlobalRank] = useState<string>('--');
    const [friendsRank, setFriendsRank] = useState<string>('--');
    const [dailyArenaLoading, setDailyArenaLoading] = useState(false);
    const { isAdFree, canRequestAds } = useAdVisibility();

    const loadInvites = async () => {
        try {
            const data = await api.getInvites();
            // Filter only pending invites
            const pending = data.filter((i: any) => i.status === 'pending');
            setInvites(pending);
        } catch (e) {
            setInvites([]);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    const [coinBalance, streakData] = await Promise.all([
                        api.getCoins().catch(() => 0),
                        api.getStreak().catch(() => ({ current_streak: 0 }))
                    ]);
                    setCoins(coinBalance);
                    setStreak(streakData.current_streak || 0);

                    const todayStr = new Date().toISOString().split('T')[0];
                    const { data: { session } } = await supabase.auth.getSession();
                    const myId = session?.user?.id;

                    const [globalMe, friendsBoard] = await Promise.all([
                        api.getLeaderboardMe('daily', todayStr).catch(() => null),
                        api.getFriendsLeaderboard('daily', todayStr).catch(() => [])
                    ]);

                    // The friends board always includes you, so only show a rank once you have friends.
                    const myFriendsEntry = friendsBoard.find((e: any) => e.user_id === myId);
                    if (myFriendsEntry && friendsBoard.length > 1) {
                        setFriendsRank(`#${myFriendsEntry.rank}`);
                    } else {
                        setFriendsRank('--');
                    }

                    if (globalMe) setGlobalRank(`#${globalMe.rank}`);
                } catch (e) {
                    console.error("Failed to load dashboard data", e);
                }
            };
            loadData();
            loadInvites();
        }, [])
    );

    useEffect(() => {
        const interval = setInterval(loadInvites, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAcceptInvite = async (inviteId: string) => {
        try {
            const res = await api.respondToInvite(inviteId, true, uuidv4());
            Alert.alert('🎉', 'Invite accepted!');
            loadInvites();
            router.push(`/arena/${res.arena_id}` as any);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to accept invite');
        }
    };

    const handleDeclineInvite = async (inviteId: string) => {
        try {
            await api.respondToInvite(inviteId, false, uuidv4());
            loadInvites();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to decline invite');
        }
    };

    const handlePlayDailyArena = async () => {
        try {
            setDailyArenaLoading(true);
            const arena = await api.getDailyArena();

            // The backend always returns the Daily Arena already active with Round 1 active.
            // Navigate directly to the active round for a seamless solo play experience.
            // Only fall back to the lobby if somehow there is no active round yet.
            if (arena.status === 'active') {
                const rounds = await api.getArenaRounds(arena.id);
                const activeRound = rounds.find((r: any) => r.status === 'active');
                if (activeRound) {
                    router.push({
                        pathname: '/arena/play',
                        params: { arenaId: arena.id, roundId: activeRound.id }
                    } as any);
                    return;
                }
                // All rounds completed — go to results
                const allDone = rounds.length > 0 && rounds.every((r: any) => r.status === 'completed');
                if (allDone) {
                    router.push(`/arena/results?arenaId=${arena.id}` as any);
                    return;
                }
            }

            // Fallback: show the lobby (handles pending state or unknown round state)
            router.push(`/arena/${arena.id}` as any);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to load Daily Arena');
        } finally {
            setDailyArenaLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.title}>Home</Text>
                        <Text style={styles.subtitle}>Rivals — Daily Puzzles & Wagers</Text>
                    </View>
                    <View style={styles.coinBadge}>
                        <Text style={styles.coinIcon}>🪙</Text>
                        <Text style={styles.coinText}>{coins}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>🔥</Text>
                    <Text style={styles.statValue}>{streak}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                </View>
                <TouchableOpacity 
                    style={styles.statCard}
                    onPress={() => router.push({ pathname: '/(tabs)/leaderboards', params: { tab: 'friends' } } as any)}
                >
                    <Text style={styles.statIcon}>🏅</Text>
                    <Text style={styles.statValue}>{friendsRank}</Text>
                    <Text style={styles.statLabel}>Friends Rank</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.statCard}
                    onPress={() => router.push({ pathname: '/(tabs)/leaderboards', params: { tab: 'global' } } as any)}
                >
                    <Text style={styles.statIcon}>🌍</Text>
                    <Text style={styles.statValue}>{globalRank}</Text>
                    <Text style={styles.statLabel}>Global Rank</Text>
                </TouchableOpacity>
            </View>

            {invites.length > 0 && (
                <View style={styles.invitesSection}>
                    <Text style={styles.sectionTitle}>Game Invites</Text>
                    {invites.map((invite) => (
                        <View key={invite.id} style={styles.inviteCard}>
                            <View style={styles.inviteInfo}>
                                <Text style={styles.inviteText}>
                                    <Text style={styles.inviteSender}>Arena Invite</Text> received!
                                </Text>
                            </View>
                            <View style={styles.inviteActions}>
                                <TouchableOpacity 
                                    style={styles.acceptBtn}
                                    onPress={() => handleAcceptInvite(invite.id)}
                                >
                                    <Text style={styles.acceptBtnText}>Join</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.declineBtn}
                                    onPress={() => handleDeclineInvite(invite.id)}
                                >
                                    <Text style={styles.declineBtnText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Today's Arena</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>LIVE</Text>
                    </View>
                </View>
                <Text style={styles.cardText}>Word Duel • Cipher Break • Number Rush</Text>
                
                <TouchableOpacity 
                    style={[styles.cardButton, dailyArenaLoading && { opacity: 0.7 }]} 
                    activeOpacity={0.8}
                    onPress={handlePlayDailyArena}
                    disabled={dailyArenaLoading}
                >
                    <Text style={styles.cardButtonText}>{dailyArenaLoading ? 'Loading...' : 'Play Now'}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.cardButton, styles.secondaryCardButton]} 
                    activeOpacity={0.8}
                    onPress={() => router.push('/arena/create' as any)}
                >
                    <Text style={styles.secondaryCardButtonText}>Create Custom Arena</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.quickActions}>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push('/(tabs)/leaderboards')}
                >
                    <Text style={styles.actionIcon}>🏆</Text>
                    <Text style={styles.actionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Leaderboards</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push('/(tabs)/friends')}
                >
                    <Text style={styles.actionIcon}>👥</Text>
                    <Text style={styles.actionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Friends</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push('/wagers')}
                >
                    <Text style={styles.actionIcon}>⚔️</Text>
                    <Text style={styles.actionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Wagers</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a1a',
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 24,
    },
    header: {
        marginBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coinBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a3a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2a2a5a',
    },
    coinIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    coinText: {
        color: '#fdcb6e',
        fontSize: 16,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#818cf8',
        marginTop: 6,
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1a1a3a',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2a5a',
    },
    statIcon: {
        fontSize: 26,
        marginBottom: 6,
    },
    statValue: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        color: '#8888aa',
        fontSize: 11,
        textAlign: 'center',
    },
    card: {
        flexGrow: 1,
        justifyContent: 'center',
        backgroundColor: '#121224',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#1f1f3a',
        // Shadow for iOS
        shadowColor: '#818cf8',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        // Elevation for Android
        elevation: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
    },
    badge: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    badgeText: {
        color: '#ef4444',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    cardText: {
        fontSize: 15,
        color: '#9ca3af',
        lineHeight: 22,
        marginBottom: 24,
    },
    cardButton: {
        backgroundColor: '#818cf8',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    cardButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    secondaryCardButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#818cf8',
        marginTop: 10,
    },
    secondaryCardButtonText: {
        color: '#818cf8',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#121224',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1f1f3a',
    },
    actionIcon: {
        fontSize: 31, // 30% larger than the previous 24
        marginBottom: 8,
    },
    actionText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        alignSelf: 'stretch',
    },
    invitesSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
    },
    inviteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a3a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#2a2a5a',
    },
    inviteInfo: {
        flex: 1,
    },
    inviteText: {
        color: '#ccc',
        fontSize: 14,
    },
    inviteSender: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    inviteActions: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptBtn: {
        backgroundColor: '#00b894',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    acceptBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    declineBtn: {
        backgroundColor: '#ff6b6b',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    declineBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});