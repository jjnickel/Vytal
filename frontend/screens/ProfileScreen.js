import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';
import { useWorkout } from '../WorkoutContext';
import { useNutritionGoals } from '../NutritionGoalsContext';

export default function ProfileScreen({ user }) {
  const { accentColor, setAccentColor, accentColors, backgroundColor, setBackgroundColor, backgroundColors } = useTheme();
  const { pastWorkouts } = useWorkout();
  const { goals, updateGoals } = useNutritionGoals();
  const navigation = useNavigation();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBackgroundColorPicker, setShowBackgroundColorPicker] = useState(false);
  const [showGoalsEditor, setShowGoalsEditor] = useState(false);
  const [tempGoals, setTempGoals] = useState({
    calories: goals.calories.toString(),
    protein: goals.protein.toString(),
    carbs: goals.carbs.toString(),
    fat: goals.fat.toString(),
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {/* Implement logout */} },
      ]
    );
  };

  const handleSaveGoals = () => {
    const newGoals = {
      calories: parseInt(tempGoals.calories) || goals.calories,
      protein: parseInt(tempGoals.protein) || goals.protein,
      carbs: parseInt(tempGoals.carbs) || goals.carbs,
      fat: parseInt(tempGoals.fat) || goals.fat,
    };
    updateGoals(newGoals);
    setShowGoalsEditor(false);
    Alert.alert('Success', 'Nutrition goals updated!');
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
      <View style={styles.homeButtonWrapper}>
        <TouchableOpacity
          style={[styles.homeButton, { backgroundColor: '#1F2937', borderColor: accentColor }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home" size={20} color={accentColor} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </View>

        {user ? (
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user.email || 'No email'}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.profileCard}>
          <Text style={styles.noUserText}>Not logged in</Text>
        </View>
        )}

        <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Nutrition Goals</Text>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => {
            setShowGoalsEditor(!showGoalsEditor);
            setTempGoals({
              calories: goals.calories.toString(),
              protein: goals.protein.toString(),
              carbs: goals.carbs.toString(),
              fat: goals.fat.toString(),
            });
          }}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>Daily Goals</Text>
            <Text style={styles.settingDescription}>
              Calories: {goals.calories} • Protein: {goals.protein}g • Carbs: {goals.carbs}g • Fat: {goals.fat}g
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {showGoalsEditor && (
          <View style={styles.goalsEditorContainer}>
            <View style={styles.goalInputGroup}>
              <Text style={styles.goalInputLabel}>Calories (kcal)</Text>
              <TextInput
                style={styles.goalInput}
                placeholder="2200"
                placeholderTextColor="#6B7280"
                value={tempGoals.calories}
                onChangeText={(text) => setTempGoals({ ...tempGoals, calories: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.goalInputGroup}>
              <Text style={styles.goalInputLabel}>Protein (g)</Text>
              <TextInput
                style={styles.goalInput}
                placeholder="150"
                placeholderTextColor="#6B7280"
                value={tempGoals.protein}
                onChangeText={(text) => setTempGoals({ ...tempGoals, protein: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.goalInputGroup}>
              <Text style={styles.goalInputLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.goalInput}
                placeholder="250"
                placeholderTextColor="#6B7280"
                value={tempGoals.carbs}
                onChangeText={(text) => setTempGoals({ ...tempGoals, carbs: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.goalInputGroup}>
              <Text style={styles.goalInputLabel}>Fat (g)</Text>
              <TextInput
                style={styles.goalInput}
                placeholder="80"
                placeholderTextColor="#6B7280"
                value={tempGoals.fat}
                onChangeText={(text) => setTempGoals({ ...tempGoals, fat: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.goalsEditorActions}>
              <TouchableOpacity
                style={[styles.goalsCancelButton, { borderColor: '#374151' }]}
                onPress={() => setShowGoalsEditor(false)}
              >
                <Text style={styles.goalsCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.goalsSaveButton, { backgroundColor: accentColor }]}
                onPress={handleSaveGoals}
              >
                <Text style={styles.goalsSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        </View>

        <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setShowColorPicker(!showColorPicker)}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>Accent Color</Text>
            <Text style={styles.settingDescription}>Choose your preferred accent color</Text>
          </View>
          <View style={[styles.colorPreview, { backgroundColor: accentColor }]} />
        </TouchableOpacity>

        {showColorPicker && (
          <View style={styles.colorPickerContainer}>
            <Text style={styles.colorPickerTitle}>Select Accent Color</Text>
            <View style={styles.colorGrid}>
              {accentColors.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.value },
                    accentColor === color.value && styles.colorOptionSelected,
                  ]}
                  onPress={() => {
                    setAccentColor(color.value);
                    setShowColorPicker(false);
                  }}
                >
                  {accentColor === color.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.colorLabels}>
              {accentColors.map((color) => (
                <Text key={color.value} style={styles.colorLabel}>{color.name}</Text>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setShowBackgroundColorPicker(!showBackgroundColorPicker)}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>Background Color</Text>
            <Text style={styles.settingDescription}>Choose your preferred background color</Text>
          </View>
          <View style={[styles.colorPreview, { backgroundColor: backgroundColor }]} />
        </TouchableOpacity>

        {showBackgroundColorPicker && (
          <View style={styles.colorPickerContainer}>
            <Text style={styles.colorPickerTitle}>Select Background Color</Text>
            <View style={styles.colorGrid}>
              {backgroundColors.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.value },
                    backgroundColor === color.value && styles.colorOptionSelected,
                  ]}
                  onPress={() => {
                    setBackgroundColor(color.value);
                    setShowBackgroundColorPicker(false);
                  }}
                >
                  {backgroundColor === color.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.colorLabels}>
              {backgroundColors.map((color) => (
                <Text key={color.value} style={styles.colorLabel}>{color.name}</Text>
              ))}
            </View>
          </View>
        )}
        </View>

        <View style={styles.workoutsSection}>
        <Text style={styles.sectionTitle}>Past Workouts</Text>
        
        {pastWorkouts.length === 0 ? (
          <View style={styles.emptyPastWorkoutsContainer}>
            <Ionicons name="calendar-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyPastWorkoutsText}>No past workouts</Text>
            <Text style={styles.emptyPastWorkoutsSubtext}>
              Complete a workout to see it here
            </Text>
          </View>
        ) : (
          pastWorkouts.map((workout) => (
            <View key={workout.id} style={styles.pastWorkoutCard}>
              <View style={styles.pastWorkoutHeader}>
                <View>
                  <Text style={styles.pastWorkoutDate}>{workout.date}</Text>
                  <Text style={styles.pastWorkoutTime}>{workout.time}</Text>
                </View>
                <View style={styles.pastWorkoutDuration}>
                  <Ionicons name="time-outline" size={16} color={accentColor} />
                  <Text style={[styles.pastWorkoutDurationText, { color: accentColor }]}>
                    {workout.duration}
                  </Text>
                </View>
              </View>
              <View style={styles.pastWorkoutDivider} />
              {workout.mode === 'custom' && workout.exercises && (
                <View style={styles.pastWorkoutExercises}>
                  <Text style={styles.pastWorkoutExercisesTitle}>
                    Exercises ({workout.exercises.length})
                  </Text>
                  {workout.exercises.slice(0, 3).map((ex, idx) => (
                    <Text key={idx} style={styles.pastWorkoutExerciseItem}>
                      • {ex.name} - {ex.sets}x{ex.reps} @ {ex.weight}lbs
                    </Text>
                  ))}
                  {workout.exercises.length > 3 && (
                    <Text style={styles.pastWorkoutMoreExercises}>
                      +{workout.exercises.length - 3} more exercises
                    </Text>
                  )}
                </View>
              )}
              {workout.mode === 'generate' && workout.plan && (
                <View style={styles.pastWorkoutPlan}>
                  <Text style={styles.pastWorkoutPlanText} numberOfLines={3}>
                    {workout.plan.content}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
        </View>

        <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: accentColor }]} 
          onPress={handleLogout}
        >
          <Text style={[styles.logoutButtonText, { color: accentColor }]}>Logout</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  homeButtonWrapper: {
    position: 'absolute',
    top: 50,
    left: 10,
    zIndex: 10,
    width: 44,
    height: 44,
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#1F2937',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 80, // Space for banner (60px) + spacing
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    marginTop: 10,
  },
  title: {
    fontSize: 36,
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
  profileSection: {
    marginBottom: 32,
  },
  profileCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  noUserText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  settingItem: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#374151',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLeft: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#374151',
  },
  colorPickerContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 12,
  },
  colorPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 16,
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#F9FAFB',
    transform: [{ scale: 1.1 }],
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  colorLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorLabel: {
    width: 50,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  actionsSection: {
    marginTop: 8,
  },
  logoutButton: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  workoutsSection: {
    marginBottom: 32,
  },
  emptyPastWorkoutsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  emptyPastWorkoutsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPastWorkoutsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  pastWorkoutCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  pastWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pastWorkoutDate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  pastWorkoutTime: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  pastWorkoutDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pastWorkoutDurationText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pastWorkoutDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginBottom: 12,
  },
  pastWorkoutExercises: {
    marginTop: 4,
  },
  pastWorkoutExercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pastWorkoutExerciseItem: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 4,
    fontWeight: '400',
  },
  pastWorkoutMoreExercises: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  pastWorkoutPlan: {
    marginTop: 4,
  },
  pastWorkoutPlanText: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
    fontWeight: '400',
  },
  goalsEditorContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 12,
  },
  goalInputGroup: {
    marginBottom: 16,
  },
  goalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  goalInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '500',
  },
  goalsEditorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  goalsCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  goalsCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  goalsSaveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  goalsSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
