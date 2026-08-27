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

export const getCoinState = () => coinState;

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
