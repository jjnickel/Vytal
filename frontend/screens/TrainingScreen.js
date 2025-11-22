import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useTheme } from '../ThemeContext';
import { useWorkout } from '../WorkoutContext';

// Mock exercise database
const EXERCISE_DATABASE = [
  { id: 1, name: 'Bench Press', category: 'Chest', muscle: 'Pectorals' },
  { id: 2, name: 'Squat', category: 'Legs', muscle: 'Quadriceps' },
  { id: 3, name: 'Deadlift', category: 'Back', muscle: 'Hamstrings' },
  { id: 4, name: 'Overhead Press', category: 'Shoulders', muscle: 'Deltoids' },
  { id: 5, name: 'Barbell Row', category: 'Back', muscle: 'Lats' },
  { id: 6, name: 'Pull-ups', category: 'Back', muscle: 'Lats' },
  { id: 7, name: 'Dips', category: 'Triceps', muscle: 'Triceps' },
  { id: 8, name: 'Bicep Curls', category: 'Arms', muscle: 'Biceps' },
  { id: 9, name: 'Tricep Extensions', category: 'Arms', muscle: 'Triceps' },
  { id: 10, name: 'Leg Press', category: 'Legs', muscle: 'Quadriceps' },
  { id: 11, name: 'Lunges', category: 'Legs', muscle: 'Quadriceps' },
  { id: 12, name: 'Leg Curls', category: 'Legs', muscle: 'Hamstrings' },
  { id: 13, name: 'Calf Raises', category: 'Legs', muscle: 'Calves' },
  { id: 14, name: 'Chest Flyes', category: 'Chest', muscle: 'Pectorals' },
  { id: 15, name: 'Lateral Raises', category: 'Shoulders', muscle: 'Deltoids' },
  { id: 16, name: 'Front Raises', category: 'Shoulders', muscle: 'Deltoids' },
  { id: 17, name: 'Hammer Curls', category: 'Arms', muscle: 'Biceps' },
  { id: 18, name: 'Push-ups', category: 'Chest', muscle: 'Pectorals' },
  { id: 19, name: 'Plank', category: 'Core', muscle: 'Abs' },
  { id: 20, name: 'Crunches', category: 'Core', muscle: 'Abs' },
  { id: 21, name: 'Russian Twists', category: 'Core', muscle: 'Obliques' },
  { id: 22, name: 'Leg Raises', category: 'Core', muscle: 'Abs' },
  { id: 23, name: 'Shoulder Shrugs', category: 'Back', muscle: 'Traps' },
  { id: 24, name: 'Face Pulls', category: 'Back', muscle: 'Rear Delts' },
];

export default function TrainingScreen({ user }) {
  const { accentColor, backgroundColor } = useTheme();
  const { addPastWorkout } = useWorkout();
  const navigation = useNavigation();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('generate'); // 'generate' or 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/workout-plan', {
        params: { goal: 'general fitness', experience: 'beginner' }
      });
      setPlan(res.data.plan);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (workoutActive && workoutStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
        setWorkoutDuration(elapsed);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [workoutActive, workoutStartTime]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startWorkout = () => {
    setWorkoutActive(true);
    setWorkoutStartTime(Date.now());
    setWorkoutDuration(0);
  };

  const endWorkout = () => {
    if (selectedExercises.length > 0 || plan) {
      const workout = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        duration: formatTime(workoutDuration),
        exercises: mode === 'custom' ? [...selectedExercises] : null,
        plan: mode === 'generate' ? plan : null,
        mode: mode,
      };
      addPastWorkout(workout);
    }
    // Clear the workout from the screen
    setSelectedExercises([]);
    setPlan(null);
    setWorkoutActive(false);
    setWorkoutStartTime(null);
    setWorkoutDuration(0);
  };

  const filteredExercises = EXERCISE_DATABASE.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.muscle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addExercise = (exercise) => {
    const newExercise = {
      ...exercise,
      weight: '',
      reps: '',
      sets: '1',
    };
    setSelectedExercises([...selectedExercises, newExercise]);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const removeExercise = (id) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== id));
  };

  const updateExercise = (id, field, value) => {
    setSelectedExercises(selectedExercises.map(ex =>
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
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
      <View style={styles.header}>
        <Text style={styles.title}>Training Plan</Text>
        <Text style={styles.subtitle}>Your personalized workout routine</Text>
      </View>

      <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.modeButton, 
                mode === 'generate' && { backgroundColor: accentColor, shadowColor: accentColor },
                mode !== 'generate' && styles.modeButtonInactive
              ]} 
              onPress={() => {
                setMode('generate');
                fetchPlan();
              }}
              disabled={loading}
            >
              <Text style={[
                styles.modeButtonText,
                mode === 'generate' && styles.modeButtonTextActive,
                mode !== 'generate' && styles.modeButtonTextInactive
              ]}>
                Generate Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.modeButton, 
                mode === 'custom' && { backgroundColor: accentColor, shadowColor: accentColor },
                mode !== 'custom' && styles.modeButtonInactive
              ]} 
              onPress={() => setMode('custom')}
            >
              <Text style={[
                styles.modeButtonText,
                mode === 'custom' && styles.modeButtonTextActive,
                mode !== 'custom' && styles.modeButtonTextInactive
              ]}>
                Write Your Own
              </Text>
            </TouchableOpacity>
          </View>

          {/* Workout Timer and Controls */}
          {workoutActive && (
            <View style={styles.timerContainer}>
              <View style={styles.timerCard}>
                <Ionicons name="time-outline" size={24} color={accentColor} />
                <Text style={[styles.timerText, { color: accentColor }]}>
                  {formatTime(workoutDuration)}
                </Text>
                <Text style={styles.timerLabel}>Workout Time</Text>
              </View>
            </View>
          )}

          {!workoutActive && (mode === 'custom' && selectedExercises.length > 0 || mode === 'generate' && plan) && (
            <TouchableOpacity 
              style={[styles.startWorkoutButton, { backgroundColor: accentColor, shadowColor: accentColor }]}
              onPress={startWorkout}
            >
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
            </TouchableOpacity>
          )}

          {workoutActive && (
            <TouchableOpacity 
              style={[styles.endWorkoutButton, { borderColor: '#EF4444' }]}
              onPress={endWorkout}
            >
              <Ionicons name="stop" size={20} color="#EF4444" />
              <Text style={[styles.endWorkoutButtonText, { color: '#EF4444' }]}>End Workout</Text>
            </TouchableOpacity>
          )}

      {mode === 'generate' && (
        <>
          {loading && !plan && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={styles.loadingText}>Generating your workout plan...</Text>
            </View>
          )}

          {plan && (
            <ScrollView 
              style={styles.planContainer}
              contentContainerStyle={styles.planContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.planCard}>
                <Text style={styles.planText}>{plan.content}</Text>
              </View>
            </ScrollView>
          )}
        </>
      )}

      {mode === 'custom' && (
        <View style={styles.customWorkoutContainer}>
          {/* Search Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setShowSearchResults(text.length > 0);
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            {showSearchResults && filteredExercises.length > 0 && (
              <View style={styles.searchResultsContainer}>
                <FlatList
                  data={filteredExercises}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.searchResultItem}
                      onPress={() => addExercise(item)}
                    >
                      <View style={styles.searchResultContent}>
                        <Text style={styles.searchResultName}>{item.name}</Text>
                        <Text style={styles.searchResultCategory}>{item.category} • {item.muscle}</Text>
                      </View>
                      <Ionicons name="add-circle" size={24} color={accentColor} />
                    </TouchableOpacity>
                  )}
                  style={styles.searchResultsList}
                  nestedScrollEnabled
                />
              </View>
            )}

            {showSearchResults && filteredExercises.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No exercises found</Text>
              </View>
            )}
          </View>

          {/* Selected Exercises List */}
          <ScrollView 
            style={styles.exercisesList}
            contentContainerStyle={styles.exercisesListContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.exercisesListTitle}>
              Your Workout ({selectedExercises.length} {selectedExercises.length === 1 ? 'exercise' : 'exercises'})
            </Text>

            {selectedExercises.length === 0 ? (
              <View style={styles.emptyWorkoutContainer}>
                <Ionicons name="barbell-outline" size={48} color="#6B7280" />
                <Text style={styles.emptyWorkoutText}>No exercises added yet</Text>
                <Text style={styles.emptyWorkoutSubtext}>Search and add exercises to build your workout</Text>
              </View>
            ) : (
              selectedExercises.map((exercise, index) => (
                <View key={exercise.id} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseCategory}>{exercise.category} • {exercise.muscle}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeExercise(exercise.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.exerciseInputs}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Sets</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="1"
                        placeholderTextColor="#6B7280"
                        value={exercise.sets}
                        onChangeText={(value) => updateExercise(exercise.id, 'sets', value)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Weight (lbs)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                        value={exercise.weight}
                        onChangeText={(value) => updateExercise(exercise.id, 'weight', value)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Reps</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                        value={exercise.reps}
                        onChangeText={(value) => updateExercise(exercise.id, 'reps', value)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

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
  header: {
    marginBottom: 24,
    marginTop: 80, // Space for banner (60px) + spacing
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  modeButtonInactive: {
    backgroundColor: '#1F2937',
    borderWidth: 1.5,
    borderColor: '#374151',
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  modeButtonTextInactive: {
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  planContainer: {
    flex: 1,
  },
  planContent: {
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  planText: {
    fontSize: 16,
    color: '#E5E7EB',
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  customWorkoutContainer: {
    flex: 1,
    marginTop: 8,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#374151',
    height: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '500',
  },
  searchResultsContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 8,
    maxHeight: 300,
  },
  searchResultsList: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  exercisesList: {
    flex: 1,
  },
  exercisesListContent: {
    paddingBottom: 20,
  },
  exercisesListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  emptyWorkoutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyWorkoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyWorkoutSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  exerciseCategory: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  removeButton: {
    padding: 4,
  },
  exerciseInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '500',
    textAlign: 'center',
  },
  timerContainer: {
    marginBottom: 16,
  },
  timerCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
  },
  timerLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 4,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 14,
    marginBottom: 16,
    gap: 8,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  startWorkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  endWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 2,
    backgroundColor: 'transparent',
    gap: 8,
  },
  endWorkoutButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
