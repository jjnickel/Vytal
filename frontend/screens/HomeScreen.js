import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';
import { useNutritionGoals } from '../NutritionGoalsContext';

export default function HomeScreen({ user }) {
  const { accentColor, backgroundColor } = useTheme();
  const { goals } = useNutritionGoals();
  const navigation = useNavigation();

  // Mock data - in a real app this would come from API/storage
  const workoutStreak = 7;
  const healthScore = 85;
  const nutritionGoals = {
    calories: { current: 1850, target: goals.calories },
    protein: { current: 120, target: goals.protein },
    carbs: { current: 200, target: goals.carbs },
    fat: { current: 65, target: goals.fat },
  };

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const ProgressBar = ({ label, current, target, unit, color }) => {
    const progress = calculateProgress(current, target);
    return (
      <View style={styles.progressItem}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>
            {current} / {target} {unit}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${progress}%`, backgroundColor: color }
            ]} 
          />
        </View>
      </View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]} 
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!</Text>
        <Text style={styles.subtitle}>Here's your fitness overview</Text>
      </View>

      {/* Workout Streak Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🔥</Text>
          <Text style={styles.cardTitle}>Workout Streak</Text>
        </View>
        <View style={styles.streakContainer}>
          <Text style={[styles.streakNumber, { color: accentColor }]}>{workoutStreak}</Text>
          <Text style={styles.streakLabel}>days in a row</Text>
        </View>
        <Text style={styles.streakMessage}>Keep it up! You're on fire! 🔥</Text>
      </View>

      {/* Health Score Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>💚</Text>
          <Text style={styles.cardTitle}>Overall Health Score</Text>
        </View>
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNumber, { color: accentColor }]}>{healthScore}</Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
        </View>
        <Text style={styles.scoreDescription}>
          Based on your activity, nutrition, and sleep patterns
        </Text>
      </View>

      {/* Nutrition Goals Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🥗</Text>
          <Text style={styles.cardTitle}>Daily Nutrition Goals</Text>
        </View>
        <View style={styles.nutritionContainer}>
          <ProgressBar 
            label="Calories" 
            current={nutritionGoals.calories.current} 
            target={nutritionGoals.calories.target} 
            unit="kcal"
            color={accentColor}
          />
          <ProgressBar 
            label="Protein" 
            current={nutritionGoals.protein.current} 
            target={nutritionGoals.protein.target} 
            unit="g"
            color={accentColor}
          />
          <ProgressBar 
            label="Carbs" 
            current={nutritionGoals.carbs.current} 
            target={nutritionGoals.carbs.target} 
            unit="g"
            color={accentColor}
          />
          <ProgressBar 
            label="Fat" 
            current={nutritionGoals.fat.current} 
            target={nutritionGoals.fat.target} 
            unit="g"
            color={accentColor}
          />
        </View>
      </View>

      {/* Quick Action Button */}
      <TouchableOpacity 
        style={[styles.trainingButton, { backgroundColor: accentColor, shadowColor: accentColor }]}
        onPress={() => navigation.navigate('Training')}
      >
        <Text style={styles.trainingButtonText}>Start Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: -0.3,
  },
  streakContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: -1,
  },
  streakLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 4,
  },
  streakMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '400',
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  scoreCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '400',
  },
  nutritionContainer: {
    marginTop: 8,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  trainingButton: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  trainingButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

