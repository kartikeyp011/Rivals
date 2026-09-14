import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getArenas } from '../../lib/api';

export default function ArenasListScreen() {
  const [arenas, setArenas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArenas();
  }, []);

  const fetchArenas = async () => {
    try {
      setLoading(true);
      const data = await getArenas();
      setArenas(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching arenas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Arenas</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6c5ce7" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : arenas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No arenas found.</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/arena/create' as any)}
          >
            <Text style={styles.createButtonText}>Create Custom Arena</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {arenas.map(arena => (
            <TouchableOpacity 
              key={arena.id} 
              style={styles.card}
              onPress={() => router.push(`/arena/${arena.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{arena.category || 'Mixed'} Arena</Text>
                <Text style={styles.statusBadge}>{arena.status}</Text>
              </View>
              <Text style={styles.cardDetails}>
                Difficulty: {arena.difficulty || 'Any'} • Rounds: {arena.max_rounds}
              </Text>
              <Text style={styles.cardDate}>
                Created: {new Date(arena.created_at).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
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
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
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
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#8888aa',
    fontSize: 16,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: '#1a1a3a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    color: '#fdcb6e',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardDetails: {
    color: '#8888aa',
    fontSize: 14,
    marginBottom: 4,
  },
  cardDate: {
    color: '#636e72',
    fontSize: 12,
  },
});
