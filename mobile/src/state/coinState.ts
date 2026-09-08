import { supabase } from '../lib/supabase';

export interface CoinTransaction {
  id: string;
  type: 'initial' | 'earn' | 'wager' | 'payout' | 'refund';
  amount: number;
  description: string;
  date: Date;
}

export interface CoinState {
  balance: number;
  transactions: CoinTransaction[];
}

// Simple global state for coins
let coinState: CoinState = {
  balance: 100, // Start with 100 coins
  transactions: [
    {
      id: '1',
      type: 'initial',
      amount: 100,
      description: 'Welcome bonus - 100 starting coins!',
      date: new Date(),
    }
  ],
};

let hasFetchedFromSupabase = false;

export const getCoinState = () => coinState;

export const fetchUserWalletBalance = async (): Promise<number> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return coinState.balance;
    }

    const { data, error } = await supabase
      .from('user_coin_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (!error && data && typeof data.balance === 'number') {
      coinState.balance = data.balance;
      hasFetchedFromSupabase = true;
    }
  } catch (err) {
    console.error('Failed to fetch wallet balance');
  }
  return coinState.balance;
};

export const fetchUserCoinTransactions = async (): Promise<CoinTransaction[]> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return coinState.transactions;
    }

    const { data, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const parsedTransactions: CoinTransaction[] = data.map((tx: any) => ({
        id: tx.id?.toString() || Math.random().toString(),
        type: tx.type || 'earn',
        amount: Number(tx.amount) || 0,
        description: tx.description || '',
        date: tx.created_at ? new Date(tx.created_at) : new Date(),
      }));
      coinState.transactions = parsedTransactions;
    }
  } catch (err) {
    console.error('Failed to fetch coin transactions');
  }
  return coinState.transactions;
};

export const addCoins = (amount: number, description: string, type: CoinTransaction['type']) => {
  coinState.balance += amount;
  coinState.transactions.push({
    id: Date.now().toString(),
    type,
    amount,
    description,
    date: new Date(),
  });
};

export const spendCoins = (amount: number, description: string, type: CoinTransaction['type']) => {
  if (coinState.balance < amount) {
    throw new Error('Insufficient coins');
  }
  coinState.balance -= amount;
  coinState.transactions.push({
    id: Date.now().toString(),
    type,
    amount: -amount,
    description,
    date: new Date(),
  });
};

export const resetCoinState = () => {
  if (hasFetchedFromSupabase) {
    return;
  }
  coinState = {
    balance: 100,
    transactions: [
      {
        id: '1',
        type: 'initial',
        amount: 100,
        description: 'Welcome bonus - 100 starting coins!',
        date: new Date(),
      }
    ],
  };
};

// Reward coins based on Arena performance
export const rewardArenaCoins = (score: number, correctCount: number) => {
  // Base reward: 10 coins for completing
  let reward = 10;
  
  // Bonus for correct answers
  if (correctCount === 3) reward += 20;
  else if (correctCount === 2) reward += 10;
  else if (correctCount === 1) reward += 5;
  
  // Bonus for high score
  if (score >= 400) reward += 15;
  else if (score >= 300) reward += 10;
  else if (score >= 200) reward += 5;
  
  addCoins(reward, `Arena completion: ${correctCount}/3 correct, ${score} points`, 'earn');
  return reward;
};
