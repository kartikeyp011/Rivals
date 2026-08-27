import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { getCoinState, CoinTransaction } from '@/state/coinState';

export default function CoinActivityScreen() {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const state = getCoinState();
    setBalance(state.balance);
    setTransactions([...state.transactions].reverse()); // Show newest first
  }, []);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'initial': return '🎁';
      case 'earn': return '💰';
      case 'wager': return '⚔️';
      case 'payout': return '🏆';
      case 'refund': return '↩️';
      default: return '🪙';
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? styles.positive : styles.negative;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Coin Activity</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceIcon}>🪙</Text>
          <Text style={styles.balanceAmount}>{balance}</Text>
        </View>
      </View>

      {/* Transactions List */}
      <Text style={styles.sectionTitle}>Transaction History</Text>
      
      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🪙</Text>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>Complete the Arena to earn coins!</Text>
        </View>
      ) : (
        <ScrollView style={styles.transactionList} showsVerticalScrollIndicator={false}>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionIcon}>{getTransactionIcon(tx.type)}</Text>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{tx.description}</Text>
                  <Text style={styles.transactionDate}>{formatDate(tx.date)}</Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, getTransactionColor(tx.amount)]}>
                {tx.amount >= 0 ? '+' : ''}{tx.amount}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#ffffff',
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  balanceCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a5a',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#8888aa',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  balanceAmount: {
    color: '#fdcb6e',
    fontSize: 36,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  transactionList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positive: {
    color: '#00b894',
  },
  negative: {
    color: '#ff6b6b',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
});
