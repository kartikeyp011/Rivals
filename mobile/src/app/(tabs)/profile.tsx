import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as api from '@/lib/api';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
    const [coins, setCoins] = useState(0);
    const [streak, setStreak] = useState(0);
    const [displayUsername, setDisplayUsername] = useState<string>('Player');
    const [avatarUrl, setAvatarUrl] = useState<string>('👤');
    const [isDeleting, setIsDeleting] = useState(false);
    const [linkedProviders, setLinkedProviders] = useState({ google: false, apple: false });

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

                if (user.identities) {
                    setLinkedProviders({
                        google: user.identities.some(id => id.provider === 'google'),
                        apple: user.identities.some(id => id.provider === 'apple'),
                    });
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profile) {
                    if (profile.username) {
                        setDisplayUsername('@' + profile.username);
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
                
                <View style={styles.providersContainer}>
                    <Text style={styles.providersTitle}>Sign-in methods</Text>
                    {linkedProviders.google && <Text style={styles.providerText}>✓ Google</Text>}
                    {linkedProviders.apple && <Text style={styles.providerText}>✓ Apple</Text>}
                    {!linkedProviders.google && !linkedProviders.apple && <Text style={styles.providerText}>✓ Email</Text>}
                </View>

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
        color: '#aaaacc',
        fontSize: 14,
        marginBottom: 8,
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