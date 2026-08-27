import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Home</Text>
                <Text style={styles.subtitle}>Rivals — Daily Puzzles & Wagers</Text>
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
        marginBottom: 32,
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