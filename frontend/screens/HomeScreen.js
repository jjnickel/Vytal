import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
    <View style={[styles.container, { backgroundColor }]}>
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <Image
          source={require('../assets/logo2.png')}
          style={styles.bannerLogo}
          resizeMode="contain"
        />
      </View>
      <ScrollView 
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
        onPress={() => navigation.navigate('Main', { screen: 'Training' })}
      >
        <Text style={styles.trainingButtonText}>Start Workout</Text>
      </TouchableOpacity>
      </ScrollView>
      <BottomTabBar navigation={navigation} accentColor={accentColor} />
    </View>
  );
}

// Bottom Tab Bar Component
function BottomTabBar({ navigation, accentColor }) {
  const tabs = [
    { name: 'Training', icon: 'barbell-outline', route: 'Main', tabName: 'Training' },
    { name: 'Nutrition', icon: 'nutrition-outline', route: 'Main', tabName: 'Nutrition' },
    { name: 'PersonalTrainer', icon: 'fitness', route: 'Main', tabName: 'PersonalTrainer' },
    { name: 'Health', icon: 'heart-outline', route: 'Main', tabName: 'Health' },
    { name: 'Profile', icon: 'person-outline', route: 'Main', tabName: 'Profile' },
  ];

  const handleTabPress = (tab) => {
    // Navigate to Main tabs and then to the specific tab
    navigation.navigate('Main', { 
      screen: tab.tabName 
    });
  };

  return (
    <View style={styles.bottomTabBar}>
      {tabs.map((tab, index) => {
        const isPersonalTrainer = tab.name === 'PersonalTrainer';
        const isActive = false; // Home is not a tab, so none are active
        
        if (isPersonalTrainer) {
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab)}
            >
              <View
                style={[
                  styles.personalTrainerTab,
                  {
                    backgroundColor: '#374151',
                  },
                ]}
              >
                <Image
                  source={require('../assets/logo.png')}
                  style={{
                    width: 56,
                    height: 56,
                    resizeMode: 'cover',
                  }}
                />
              </View>
            </TouchableOpacity>
          );
        }
        
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab)}
          >
            <Ionicons name={tab.icon} size={24} color="#9CA3AF" />
            <Text style={styles.tabLabel}>{tab.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  topBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 20,
    paddingBottom: 10,
    zIndex: 5,
  },
  bannerLogo: {
    width: 120,
    height: 40,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 80, // Space for banner (60px) + spacing
    paddingBottom: 100, // Extra padding for bottom tab bar
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
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    height: 70, // Match the Personal Trainer tab height
    paddingTop: 5,
    paddingBottom: 8, // Extra padding for Personal Trainer tab
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  personalTrainerTab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
});

