import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { getAcceptedFriends, Friend } from '@/state/friendState';
import { createWager } from '@/state/wagerState';
import { getCoinState } from '@/state/coinState';

type WagerType = '1v1' | 'multi';
type StakeAmount = 10 | 25 | 50;

export default function CreateWagerScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [wagerType, setWagerType] = useState<WagerType>('1v1');
  const [stake, setStake] = useState<StakeAmount>(10);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    setFriends(getAcceptedFriends());
    setCoins(getCoinState().balance);
  }, []);

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        if (wagerType === '1v1' && prev.length >= 1) {
          Alert.alert('⚠️', '1v1 wager can only have 1 opponent');
          return prev;
        }
        return [...prev, friendId];
      }
    });
  };

  const handleCreate = () => {
    if (selectedFriends.length === 0) {
      Alert.alert('⚠️', 'Please select at least one friend');
      return;
    }

    if (wagerType === '1v1' && selectedFriends.length !== 1) {
      Alert.alert('⚠️', '1v1 wager requires exactly 1 opponent');
      return;
    }

    if (wagerType === 'multi' && selectedFriends.length < 2) {
      Alert.alert('⚠️', 'Multi-friend wager requires at least 2 friends');
      return;
    }

    if (coins < stake) {
      Alert.alert('⚠️', `You only have ${coins} coins. Need ${stake} coins for this wager.`);
      return;
    }

    const wager = createWager(wagerType, stake, selectedFriends);
    if (wager) {
      Alert.alert('✅', 'Wager created successfully!');
      router.replace('/wagers' as any);
    } else {
      Alert.alert('❌', 'Failed to create wager. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Wager</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coin Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Coins</Text>
          <Text style={styles.balanceAmount}>🪙 {coins}</Text>
        </View>

        {/* Wager Type */}
        <Text style={styles.sectionTitle}>Wager Type</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeOption, wagerType === '1v1' && styles.typeSelected]}
            onPress={() => {
              setWagerType('1v1');
              setSelectedFriends([]);
            }}
          >
            <Text style={styles.typeEmoji}>⚔️</Text>
            <Text style={[styles.typeText, wagerType === '1v1' && styles.typeTextSelected]}>
              1v1
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeOption, wagerType === 'multi' && styles.typeSelected]}
            onPress={() => {
              setWagerType('multi');
              setSelectedFriends([]);
            }}
          >
            <Text style={styles.typeEmoji}>👥</Text>
            <Text style={[styles.typeText, wagerType === 'multi' && styles.typeTextSelected]}>
              Multi-Friend
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stake Amount */}
        <Text style={styles.sectionTitle}>Stake Amount</Text>
        <View style={styles.stakeContainer}>
          {[10, 25, 50].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[styles.stakeOption, stake === amount && styles.stakeSelected]}
              onPress={() => setStake(amount as StakeAmount)}
            >
              <Text style={[styles.stakeText, stake === amount && styles.stakeTextSelected]}>
                🪙 {amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Select Friends */}
        <Text style={styles.sectionTitle}>
          Select Friends {wagerType === '1v1' ? '(1 opponent)' : '(2+ opponents)'}
        </Text>
        {friends.length === 0 ? (
          <View style={styles.noFriendsCard}>
            <Text style={styles.noFriendsText}>No friends added yet</Text>
            <Text style={styles.noFriendsSubtext}>Add friends to create wagers!</Text>
          </View>
        ) : (
          friends.map((friend) => (
            <TouchableOpacity
              key={friend.id}
              style={[
                styles.friendOption,
                selectedFriends.includes(friend.id) && styles.friendSelected,
              ]}
              onPress={() => toggleFriend(friend.id)}
            >
              <Text style={styles.friendAvatar}>{friend.avatar}</Text>
              <Text style={[
                styles.friendName,
                selectedFriends.includes(friend.id) && styles.friendNameSelected,
              ]}>
                {friend.name}
              </Text>
              {selectedFriends.includes(friend.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            (selectedFriends.length === 0 || (wagerType === '1v1' && selectedFriends.length !== 1)) && styles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={selectedFriends.length === 0 || (wagerType === '1v1' && selectedFriends.length !== 1)}
        >
          <Text style={styles.createButtonText}>
            Create Wager (🪙 {stake * (wagerType === '1v1' ? 2 : selectedFriends.length + 1)} pool)
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#ffffff',
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a5a',
    marginBottom: 20,
  },
  balanceLabel: {
    color: '#8888aa',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#fdcb6e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  typeSelected: {
    borderColor: '#6c5ce7',
    backgroundColor: '#1a1a3a',
  },
  typeEmoji: {
    fontSize: 24,
  },
  typeText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  typeTextSelected: {
    color: '#ffffff',
  },
  stakeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  stakeOption: {
    flex: 1,
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  stakeSelected: {
    borderColor: '#fdcb6e',
  },
  stakeText: {
    color: '#8888aa',
    fontSize: 14,
    fontWeight: '600',
  },
  stakeTextSelected: {
    color: '#fdcb6e',
  },
  friendOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  friendSelected: {
    borderColor: '#6c5ce7',
    backgroundColor: '#1a1a3a',
  },
  friendAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  friendName: {
    color: '#8888aa',
    fontSize: 16,
    flex: 1,
  },
  friendNameSelected: {
    color: '#ffffff',
  },
  checkmark: {
    color: '#6c5ce7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noFriendsCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a5a',
    marginBottom: 20,
  },
  noFriendsText: {
    color: '#8888aa',
    fontSize: 16,
  },
  noFriendsSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonDisabled: {
    backgroundColor: '#2a2a5a',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
