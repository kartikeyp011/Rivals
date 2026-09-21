import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, Switch } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import * as api from '@/lib/api';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
    const [coins, setCoins] = useState(0);
    const [streak, setStreak] = useState(0);
    const [displayUsername, setDisplayUsername] = useState<string>('Player');
    const [avatarUrl, setAvatarUrl] = useState<string>('👤');
    const [isDeleting, setIsDeleting] = useState(false);
    const [linkedProviders, setLinkedProviders] = useState({ google: false, apple: false });
    const [globalOptIn, setGlobalOptIn] = useState(false);

    // RevenueCat State
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

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

                    if (Platform.OS === 'ios') {
                        try {
                            const customerInfo = await Purchases.getCustomerInfo();
                            setIsSubscribed(typeof customerInfo.entitlements.active['rivals_plus'] !== 'undefined');
                        } catch (e) {
                            console.error("Failed to load subscription info", e);
                        }
                    }
                } catch (e) {
                    console.error("Failed to load dashboard data", e);
                } finally {
                    setIsLoadingSubscription(false);
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

                if (user.identities) {
                    setLinkedProviders({
                        google: user.identities.some(id => id.provider === 'google'),
                        apple: user.identities.some(id => id.provider === 'apple'),
                    });
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('username, avatar_url, global_opt_in')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profile) {
                    if (profile.username) {
                        setDisplayUsername('@' + profile.username);
                    }
                    if (profile.avatar_url) {
                        setAvatarUrl(profile.avatar_url);
                    }
                    if (profile.global_opt_in !== undefined && profile.global_opt_in !== null) {
                        setGlobalOptIn(profile.global_opt_in);
                    }
                }
            } catch (err) {
                console.error('Failed to load profile data');
            }
        }

        fetchProfile();
    }, []);

    const handleSubscription = async () => {
        if (Platform.OS !== 'ios') {
            Alert.alert("Not Supported", "Rivalss+ is currently only available on iOS.");
            return;
        }

        if (isSubscribed) {
            Alert.alert("Rivalss+ Active", "You are already a Rivalss+ subscriber! Enjoy your weekly bonus coins.");
            return;
        }

        try {
            const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
                requiredEntitlementIdentifier: 'rivals_plus'
            });

            // Refresh status after paywall closes
            const customerInfo = await Purchases.getCustomerInfo();
            if (typeof customerInfo.entitlements.active['rivals_plus'] !== 'undefined') {
                setIsSubscribed(true);
            }
        } catch (e: any) {
            console.error("Paywall error", e);
            Alert.alert("Error", e.message || "Failed to open subscription.");
        }
    };

    const handleRestorePurchases = async () => {
        if (Platform.OS !== 'ios') {
            Alert.alert("Not Supported", "Subscriptions are currently only available on iOS.");
            return;
        }

        try {
            setIsLoadingSubscription(true);
            const customerInfo = await Purchases.restorePurchases();
            if (typeof customerInfo.entitlements.active['rivals_plus'] !== 'undefined') {
                setIsSubscribed(true);
                Alert.alert("Success", "Your Rivalss+ subscription has been restored.");
            } else {
                Alert.alert("No Purchases Found", "We couldn't find any active subscriptions for your account.");
            }
        } catch (e: any) {
            console.error("Restore error", e);
            Alert.alert("Error", e.message || "Failed to restore purchases.");
        } finally {
            setIsLoadingSubscription(false);
        }
    };

    const handleToggleGlobalOptIn = async (value: boolean) => {
        // Optimistic update
        setGlobalOptIn(value);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase.from('profiles').update({ global_opt_in: value }).eq('id', user.id);
            if (error) {
                // Revert on failure
                setGlobalOptIn(!value);
                Alert.alert("Error", "Failed to save privacy preference.");
            }
        }
    };

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert("Sign Out Error", error.message || "Failed to sign out.");
        }
        // The auth state listener in _layout.tsx will automatically redirect to '/' on success
    };

    const handleDeleteAccount = () => {
        const hasBoth = linkedProviders.google && linkedProviders.apple;

        let message = "This permanently deletes your Rivals account and associated data.\n\n";

        if (hasBoth) {
            message += "You currently have Google and Apple sign-in linked to this Rivals account. Deleting your account will remove both sign-in methods from Rivals.\n\n";
        } else {
            message += "If you have linked both Google and Apple sign-in to this Rivals account, deleting your Rivals account will also remove access through both sign-in methods.\n\n";
        }

        message += "This action cannot be undone.";

        Alert.alert(
            "Deleting your Rivals account",
            message,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete My Account",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await api.deleteAccount();
                            Alert.alert(
                                "Account Deleted",
                                "Your account has been successfully deleted.",
                                [{ text: "OK", onPress: () => {
                                    supabase.auth.signOut();
                                }}]
                            );
                        } catch (err: any) {
                            Alert.alert("Error", err.message || "Failed to delete account");
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>👤 Profile</Text>
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{avatarUrl || '👤'}</Text>
            </View>
            <Text style={styles.name}>{displayUsername}</Text>

            <View style={[styles.card, isSubscribed ? styles.subscribedCard : styles.premiumCard]}>
                <TouchableOpacity onPress={handleSubscription}>
                    <Text style={[styles.cardTitle, isSubscribed && { color: '#ffd700' }]}>⭐ Rivalss+</Text>
                    {isLoadingSubscription ? (
                        <ActivityIndicator color="#fdcb6e" style={{ marginTop: 8 }} />
                    ) : (
                        <>
                            <Text style={styles.cardText}>
                                {isSubscribed
                                    ? "Active Subscription"
                                    : "Unlock weekly bonus coins & more"}
                            </Text>
                            <Text style={styles.cardSubtext}>
                                {isSubscribed ? "You're all set! →" : "Tap to view plans →"}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

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
                <Text style={styles.cardTitle}>Account Settings</Text>

                <View style={styles.settingRow}>
                    <Text style={styles.settingText}>Show me on global leaderboard</Text>
                    <Switch
                        value={globalOptIn}
                        onValueChange={handleToggleGlobalOptIn}
                        trackColor={{ false: '#2a2a5a', true: '#6c5ce7' }}
                        thumbColor={globalOptIn ? '#ffffff' : '#f4f3f4'}
                    />
                </View>
                <Text style={styles.settingHint}>
                    If enabled, your username, avatar, score, and rank will be visible to everyone on the global leaderboard.
                </Text>

                <View style={styles.providersContainer}>
                    <Text style={styles.providersTitle}>Sign-in methods</Text>
                    {linkedProviders.google && <Text style={styles.providerText}>✓ Google</Text>}
                    {linkedProviders.apple && <Text style={styles.providerText}>✓ Apple</Text>}
                    {!linkedProviders.google && !linkedProviders.apple && <Text style={styles.providerText}>✓ Email</Text>}
                </View>

                {Platform.OS === 'ios' && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleRestorePurchases}>
                        <Text style={styles.actionButtonText}>Restore Purchases</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
                    <Text style={styles.actionButtonText}>Sign Out</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteAccount} disabled={isDeleting}>
                    {isDeleting ? <ActivityIndicator color="#ff4757" /> : <Text style={styles.deleteButtonText}>Delete Account</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#0a0a1a',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 100, // Extra padding to avoid tab bar overlap
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
    premiumCard: {
        borderColor: '#fdcb6e',
        backgroundColor: '#1a1a2a',
    },
    subscribedCard: {
        borderColor: '#00b894',
        backgroundColor: '#10201a',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
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
    actionButton: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a5a',
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 16,
    },
    providersContainer: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a5a',
    },
    providersTitle: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    settingText: {
        color: '#ffffff',
        fontSize: 16,
    },
    settingHint: {
        color: '#888',
        fontSize: 12,
        marginBottom: 16,
    },
    providerText: {
        color: '#ffffff',
        fontSize: 16,
        marginBottom: 4,
    },
    deleteButton: {
        borderBottomWidth: 0,
        paddingTop: 16,
    },
    deleteButtonText: {
        color: '#ff4757',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
