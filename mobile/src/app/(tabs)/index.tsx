import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { getCoinState } from '@/state/coinState';
import { getStreakState } from '@/state/streakState';

export default function HomeScreen() {
    const [coins, setCoins] = useState(0);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        const coinState = getCoinState();
        setCoins(coinState.balance);
        const streakState = getStreakState();
        setStreak(streakState.currentStreak);
    }, []);

    return (
        <View style={styles.container}>
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
                    onPress={() => router.push('/(tabs)/leaderboards')}
                >
                    <Text style={styles.statIcon}>🏅</Text>
                    <Text style={styles.statValue}>--</Text>
                    <Text style={styles.statLabel}>Friends Rank</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.statCard}
                    onPress={() => router.push('/(tabs)/leaderboards')}
                >
                    <Text style={styles.statIcon}>🌍</Text>
                    <Text style={styles.statValue}>--</Text>
                    <Text style={styles.statLabel}>Global Rank</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Today's Arena</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>LIVE</Text>
                    </View>
                </View>
                <Text style={styles.cardText}>Word Duel • Cipher Break • Number Rush</Text>
                
                <TouchableOpacity 
                    style={styles.cardButton} 
                    activeOpacity={0.8}
                    onPress={() => router.push('/arena')}
                >
                    <Text style={styles.cardButtonText}>Play Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a1a',
        padding: 24,
        paddingTop: 80,
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
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2a5a',
    },
    statIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    statValue: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        color: '#8888aa',
        fontSize: 11,
        textAlign: 'center',
    },
    card: {
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
        fontSize: 20,
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
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    cardButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
    },
});