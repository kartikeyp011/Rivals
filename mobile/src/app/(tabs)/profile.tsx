import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, Switch, Image } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import * as api from '@/lib/api';
import { supabase } from '../../lib/supabase';
import { useAdVisibility } from '@/hooks/useAdVisibility';
import { useRewardedAd } from '@/hooks/useRewardedAd';

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
    const [isClaimingBonus, setIsClaimingBonus] = useState(false);
    // Epoch ms until which this week's bonus counts as claimed (end of the current UTC week)
    const [bonusClaimedUntil, setBonusClaimedUntil] = useState<number | null>(null);
    const bonusClaimed = bonusClaimedUntil !== null && Date.now() < bonusClaimedUntil;

    const bonusStorageKey = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user ? `weeklyBonusClaimedUntil:${user.id}` : null;
    };

    const { isAdFree, canRequestAds, isPrivacyOptionsRequired, showPrivacyOptions } = useAdVisibility();
    const { showRewardedAd, isShowing } = useRewardedAd();

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

                    try {
                        const key = await bonusStorageKey();
                        const stored = key ? await AsyncStorage.getItem(key) : null;
                        setBonusClaimedUntil(stored ? Number(stored) : null);
                    } catch {
                        // Storage is best-effort; the server still enforces one claim per week.
                    }

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
                const analyticsModule = require('@react-native-firebase/analytics');
                const analytics = analyticsModule.default || analyticsModule;
                analytics().logEvent('purchase', { items: [{ item_id: 'rivals_plus' }] }).catch(console.error);
            }
        } catch (e: any) {
            console.error("Paywall error", e);
            Alert.alert("Error", e.message || "Failed to open subscription.");
        }
    };

    const handleClaimWeeklyBonus = async () => {
        if (isClaimingBonus) return;
        try {
            setIsClaimingBonus(true);
            const res = await api.claimWeeklyBonus();
            setCoins(res.balance);

            // Both a fresh claim and "already claimed" mean the bonus is used up until next week.
            const until = new Date(res.period_end).getTime() + 1000;
            setBonusClaimedUntil(until);
            try {
                const key = await bonusStorageKey();
                if (key) await AsyncStorage.setItem(key, String(until));
            } catch {
                // Best-effort persistence.
            }
            if (res.claimed) {
                Alert.alert("Weekly Bonus Claimed", `+${res.coins_awarded} coins added to your balance!`);
            } else {
                Alert.alert("Already Claimed", "You've already claimed this week's bonus. Come back next week!");
            }
        } catch (e: any) {
            const msg: string = e?.message || '';
            if (msg.toLowerCase().includes('subscription required')) {
                Alert.alert("Still Syncing", "Your subscription is still syncing. Please try again in a minute.");
            } else {
                Alert.alert("Couldn't Claim Bonus", msg || "Please try again in a moment.");
            }
        } finally {
            setIsClaimingBonus(false);
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
                const analyticsModule = require('@react-native-firebase/analytics');
                const analytics = analyticsModule.default || analyticsModule;
                analytics().logEvent('purchase', { items: [{ item_id: 'rivals_plus' }], method: 'restore' }).catch(console.error);
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
        <View style={styles.screen}>
        <View style={styles.header}>
            <Text style={styles.title}>👤 Profile</Text>
        </View>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.avatarPlaceholder}>
                {avatarUrl && avatarUrl.startsWith('http') ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <Text style={styles.avatarText}>{avatarUrl || '👤'}</Text>
                )}
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
                {isSubscribed && !isLoadingSubscription && bonusClaimed && (
                    <Text style={styles.bonusClaimedText}>✅ Weekly bonus claimed. Next one unlocks Monday (UTC).</Text>
                )}
                {isSubscribed && !isLoadingSubscription && !bonusClaimed && (
                    <TouchableOpacity
                        style={[styles.claimButton, isClaimingBonus && { opacity: 0.6 }]}
                        onPress={handleClaimWeeklyBonus}
                        disabled={isClaimingBonus}
                    >
                        {isClaimingBonus ? (
                            <ActivityIndicator color="#0a0a1a" />
                        ) : (
                            <Text style={styles.claimButtonText}>🪙 Claim Weekly Bonus</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* 60 Coins Rewarded Ad Button */}
            {canRequestAds && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Free Coins</Text>
                    <Text style={styles.cardText}>Watch a short ad to earn 60 bonus coins!</Text>
                    <TouchableOpacity
                        style={[styles.actionButton, { borderBottomWidth: 0, marginTop: 12, backgroundColor: '#6c5ce7', borderRadius: 8, alignItems: 'center' }]}
                        onPress={() => {
                            showRewardedAd(
                                'claim_reward',
                                () => {
                                    Alert.alert('✅', 'You received 60 coins!');
                                    setCoins(prev => prev + 60);
                                },
                                (err) => {
                                    Alert.alert('❌', err.message || 'Ad was not completed.');
                                }
                            );
                        }}
                        disabled={isShowing}
                    >
                        <Text style={[styles.actionButtonText, { fontWeight: 'bold' }]}>
                            {isShowing ? 'Loading Ad...' : 'Watch Ad for 60 Coins'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

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

                {isPrivacyOptionsRequired && (
                    <TouchableOpacity style={[styles.actionButton, { marginTop: 16 }]} onPress={showPrivacyOptions}>
                        <Text style={styles.actionButtonText}>Privacy Settings</Text>
                    </TouchableOpacity>
                )}

                {__DEV__ && (
                    <TouchableOpacity
                        style={[styles.actionButton, { borderColor: 'orange', borderWidth: 1, marginTop: 20 }]}
                        onPress={() => { throw new Error("Sentry Test Error from Profile"); }}
                    >
                        <Text style={[styles.actionButtonText, { color: 'orange' }]}>Trigger Sentry Crash (Dev Only)</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // Same structure as the other tabs: fixed header, scrolling content underneath.
    screen: {
        flex: 1,
        backgroundColor: '#0a0a1a',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 12,
        alignItems: 'center',
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
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
        overflow: 'hidden',
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
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
    claimButton: {
        marginTop: 14,
        backgroundColor: '#fdcb6e',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    bonusClaimedText: {
        marginTop: 14,
        color: '#00b894',
        fontSize: 14,
        textAlign: 'center',
    },
    claimButtonText: {
        color: '#0a0a1a',
        fontSize: 16,
        fontWeight: 'bold',
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
