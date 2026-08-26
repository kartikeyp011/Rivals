import { View, Text, StyleSheet } from 'react-native';

export default function LeaderboardsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🏆 Leaderboards</Text>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Friends</Text>
                <Text style={styles.cardText}>Daily • All-Time</Text>
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Global</Text>
                <Text style={styles.cardText}>Daily • All-Time</Text>
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
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 24,
    },
    card: {
        backgroundColor: '#1a1a3a',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2a2a5a',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    cardText: {
        fontSize: 14,
        color: '#aaaacc',
        marginTop: 4,
    },
});