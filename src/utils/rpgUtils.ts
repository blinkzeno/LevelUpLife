// RPG utility functions for Solo Leveling-style progression
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';

// XP thresholds for each rank
const RANK_THRESHOLDS = {
  E: 0,
  D: 100,
  C: 300,
  B: 600,
  A: 1000,
  S: 1500,
  SS: 2500,
  SSS: 5000,
};

// Calculate user rank based on total XP
export const calculateRank = (xp: number): Rank => {
  if (xp >= RANK_THRESHOLDS.SSS) return 'SSS';
  if (xp >= RANK_THRESHOLDS.SS) return 'SS';
  if (xp >= RANK_THRESHOLDS.S) return 'S';
  if (xp >= RANK_THRESHOLDS.A) return 'A';
  if (xp >= RANK_THRESHOLDS.B) return 'B';
  if (xp >= RANK_THRESHOLDS.C) return 'C';
  if (xp >= RANK_THRESHOLDS.D) return 'D';
  return 'E';
};

// Get rank color (for glow effects)
export const getRankColor = (rank: Rank): string => {
  const colors: Record<Rank, string> = {
    E: '#64748b', // slate
    D: '#10b981', // emerald
    C: '#3b82f6', // blue
    B: '#8b5cf6', // violet
    A: '#f59e0b', // amber
    S: '#ef4444', // red
    SS: '#ec4899', // pink
    SSS: '#fbbf24', // gold
  };
  return colors[rank];
};

// Calculate XP needed for next rank
export const getXPForNextRank = (currentXP: number): { current: number; needed: number; rank: Rank } => {
  const currentRank = calculateRank(currentXP);
  const ranks: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
  const currentIndex = ranks.indexOf(currentRank);
  
  if (currentIndex === ranks.length - 1) {
    // Max rank
    return { current: currentXP, needed: RANK_THRESHOLDS.SSS, rank: 'SSS' };
  }
  
  const nextRank = ranks[currentIndex + 1];
  const nextThreshold = RANK_THRESHOLDS[nextRank];
  
  return {
    current: currentXP,
    needed: nextThreshold,
    rank: nextRank,
  };
};

// Calculate level from XP (for display)
export const calculateLevel = (xp: number): number => {
  return Math.floor(xp / 50) + 1;
};

// Get XP for next level
export const getXPForNextLevel = (level: number): number => {
  return level * 50;
};

// Get difficulty color
export const getDifficultyColor = (difficulty: Difficulty): string => {
  const colors: Record<Difficulty, string> = {
    easy: '#10b981', // emerald
    normal: '#3b82f6', // blue
    hard: '#f59e0b', // amber
    extreme: '#ef4444', // red
  };
  return colors[difficulty];
};

// Get difficulty rank
export const getDifficultyRank = (difficulty: Difficulty): Rank => {
  const ranks: Record<Difficulty, Rank> = {
    easy: 'E',
    normal: 'C',
    hard: 'A',
    extreme: 'S',
  };
  return ranks[difficulty];
};

// Calculate XP reward based on difficulty
export const calculateXPReward = (difficulty: Difficulty): number => {
  const rewards: Record<Difficulty, number> = {
    easy: 10,
    normal: 25,
    hard: 50,
    extreme: 100,
  };
  return rewards[difficulty];
};

// Get progress percentage
export const getProgressPercentage = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min((current / total) * 100, 100);
};

// Format XP display
export const formatXP = (xp: number): string => {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
};
