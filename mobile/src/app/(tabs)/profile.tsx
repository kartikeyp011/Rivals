import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as api from '@/lib/api';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
    const [coins, setCoins] = useState(0);
    const [streak, setStreak] = useState(0);
    const [displayName, setDisplayName] = useState<string>('Player');
    const [avatarUrl, setAvatarUrl] = useState<string>('👤');

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
                } catch (e) {
                    console.error("Failed to load dashboard data", e);
                }
            };
            loadData();
        }, [])
    );

    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profile) {
                    if (profile.username) {
                        setDisplayName('@' + profile.username);
                    }
                    if (profile.avatar_url) {
                        setAvatarUrl(profile.avatar_url);
                    }
                }
            } catch (err) {
                console.error('Failed to load profile data');
            }
        }

        fetchProfile();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>👤 Profile</Text>
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{avatarUrl || '👤'}</Text>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.card}>
                <TouchableOpacity onPress={() => router.push('/coins/activity' as any)}>
                    <Text style={styles.cardTitle}>Coins</Text>
                    <Text style={styles.coinAmount}>{coins}</Text>
                    <Text style={styles.cardSubtext}>Tap to view activity →</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.card}>
                <TouchableOpacity onPress={() => router.push('/streak/recovery' as any)}>
                    <Text style={styles.cardTitle}>Streak</Text>
                    <Text style={styles.cardText}>{streak} days</Text>
                    <Text style={styles.cardSubtext}>Tap to manage →</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.card}>
                <TouchableOpacity onPress={() => router.push('/wagers')}>
                    <Text style={styles.cardTitle}>⚔️ Wagers</Text>
                    <Text style={styles.cardText}>Challenge friends with coin wagers</Text>
                    <Text style={styles.cardSubtext}>Tap to view →</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Rivals+</Text>
                <Text style={styles.cardText}>Subscribe for premium benefits</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a1a',
        padding: 20,
        paddingTop: 60,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 20,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1a1a3a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#6c5ce7',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 40,
    },
    name: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 20,
    },
    card: {
        width: '100%',
        backgroundColor: '#1a1a3a',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2a2a5a',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    cardText: {
        fontSize: 14,
        color: '#aaaacc',
        marginTop: 4,
    },
    coinAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fdcb6e',
        marginTop: 4,
    },
    cardSubtext: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
});