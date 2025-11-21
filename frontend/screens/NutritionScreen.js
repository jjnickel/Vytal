import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { useNutritionGoals } from '../NutritionGoalsContext';

// Mock food database (per 100g or per serving)
const FOOD_DATABASE = [
  { id: 1, name: 'Chicken Breast', category: 'Protein', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g' },
  { id: 2, name: 'Salmon', category: 'Protein', calories: 208, protein: 20, carbs: 0, fat: 12, servingSize: '100g' },
  { id: 3, name: 'Eggs', category: 'Protein', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: '1 large egg' },
  { id: 4, name: 'Greek Yogurt', category: 'Dairy', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, servingSize: '100g' },
  { id: 5, name: 'Brown Rice', category: 'Grains', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, servingSize: '100g cooked' },
  { id: 6, name: 'Quinoa', category: 'Grains', calories: 120, protein: 4.4, carbs: 22, fat: 1.9, servingSize: '100g cooked' },
  { id: 7, name: 'Oatmeal', category: 'Grains', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, servingSize: '100g cooked' },
  { id: 8, name: 'Banana', category: 'Fruit', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: '1 medium' },
  { id: 9, name: 'Apple', category: 'Fruit', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: '1 medium' },
  { id: 10, name: 'Broccoli', category: 'Vegetables', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, servingSize: '100g' },
  { id: 11, name: 'Spinach', category: 'Vegetables', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, servingSize: '100g' },
  { id: 12, name: 'Sweet Potato', category: 'Vegetables', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, servingSize: '100g' },
  { id: 13, name: 'Almonds', category: 'Nuts', calories: 579, protein: 21, carbs: 22, fat: 50, servingSize: '100g' },
  { id: 14, name: 'Peanut Butter', category: 'Nuts', calories: 588, protein: 25, carbs: 20, fat: 50, servingSize: '100g' },
  { id: 15, name: 'Avocado', category: 'Fruit', calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: '1 medium' },
  { id: 16, name: 'Whole Wheat Bread', category: 'Grains', calories: 247, protein: 13, carbs: 41, fat: 4.2, servingSize: '100g' },
  { id: 17, name: 'Tuna', category: 'Protein', calories: 144, protein: 30, carbs: 0, fat: 1, servingSize: '100g' },
  { id: 18, name: 'Cottage Cheese', category: 'Dairy', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, servingSize: '100g' },
  { id: 19, name: 'Milk', category: 'Dairy', calories: 42, protein: 3.4, carbs: 5, fat: 1, servingSize: '100ml' },
  { id: 20, name: 'Whey Protein', category: 'Supplements', calories: 103, protein: 20, carbs: 2, fat: 1, servingSize: '1 scoop (30g)' },
];

export default function NutritionScreen() {
  const { accentColor, backgroundColor } = useTheme();
  const { goals: DAILY_GOALS } = useNutritionGoals();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    servingSize: '',
  });

  // Calculate totals
  const totals = selectedFoods.reduce((acc, food) => ({
    calories: acc.calories + (food.calories || 0),
    protein: acc.protein + (food.protein || 0),
    carbs: acc.carbs + (food.carbs || 0),
    fat: acc.fat + (food.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const filteredFoods = FOOD_DATABASE.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    food.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addFood = (food) => {
    const newFood = {
      ...food,
      amount: '',
      unit: 'servings', // default to servings
      multiplier: 1,
    };
    setSelectedFoods([...selectedFoods, newFood]);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const removeFood = (id) => {
    setSelectedFoods(selectedFoods.filter(f => f.id !== id));
  };

  const updateFood = (id, field, value) => {
    setSelectedFoods(selectedFoods.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, [field]: value };
      
      // Calculate multiplier based on unit
      if (field === 'amount' || field === 'unit') {
        const amount = parseFloat(updated.amount) || 0;
        if (updated.unit === 'servings') {
          updated.multiplier = amount;
        } else if (updated.unit === 'weight') {
          // Assuming serving size is per 100g, calculate multiplier
          const servingWeight = parseFloat(updated.servingSize?.replace('g', '').replace('ml', '') || 100);
          updated.multiplier = amount / servingWeight;
        }
        
        // Recalculate macros
        updated.calories = (updated.baseCalories || updated.calories) * updated.multiplier;
        updated.protein = (updated.baseProtein || updated.protein) * updated.multiplier;
        updated.carbs = (updated.baseCarbs || updated.carbs) * updated.multiplier;
        updated.fat = (updated.baseFat || updated.fat) * updated.multiplier;
      }
      
      return updated;
    }));
  };

  const saveCustomFood = () => {
    if (!customFood.name || !customFood.calories || !customFood.protein || !customFood.carbs || !customFood.fat) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }
    
    const newFood = {
      id: Date.now(),
      name: customFood.name,
      category: 'Custom',
      calories: parseFloat(customFood.calories),
      protein: parseFloat(customFood.protein),
      carbs: parseFloat(customFood.carbs),
      fat: parseFloat(customFood.fat),
      servingSize: customFood.servingSize || '1 serving',
      baseCalories: parseFloat(customFood.calories),
      baseProtein: parseFloat(customFood.protein),
      baseCarbs: parseFloat(customFood.carbs),
      baseFat: parseFloat(customFood.fat),
    };
    
    addFood(newFood);
    setShowCustomFoodModal(false);
    setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '', servingSize: '' });
  };

  // Pie chart component (simplified circular progress)
  const PieChart = ({ label, current, target, color }) => {
    const percentage = Math.min((current / target) * 100, 100);
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    // Create a simple circular progress using border
    const getBorderStyle = () => {
      if (percentage >= 100) {
        return { borderColor: color };
      } else if (percentage >= 75) {
        return {
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
        };
      } else if (percentage >= 50) {
        return {
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
        };
      } else if (percentage >= 25) {
        return {
          borderColor: color,
          borderTopColor: 'transparent',
        };
      } else {
        return {
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
        };
      }
    };
    
    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          <View style={[
            styles.pieChartCircle,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              borderWidth: 8,
              borderColor: '#374151',
            },
            getBorderStyle(),
          ]}>
            <View style={styles.pieChartInner}>
              <Text style={styles.pieChartPercentage}>{Math.round(percentage)}%</Text>
              <Text style={styles.pieChartLabel}>{label}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.pieChartValue}>
          {Math.round(current)} / {target}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition Tracker</Text>
          <Text style={styles.subtitle}>Track your daily macros and calories</Text>
        </View>

        {/* Pie Charts */}
        <View style={styles.pieChartsContainer}>
          <PieChart 
            label="Calories" 
            current={totals.calories} 
            target={DAILY_GOALS.calories} 
            color={accentColor}
          />
          <PieChart 
            label="Protein" 
            current={totals.protein} 
            target={DAILY_GOALS.protein} 
            color="#10B981"
          />
          <PieChart 
            label="Carbs" 
            current={totals.carbs} 
            target={DAILY_GOALS.carbs} 
            color="#3B82F6"
          />
          <PieChart 
            label="Fat" 
            current={totals.fat} 
            target={DAILY_GOALS.fat} 
            color="#F59E0B"
          />
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods..."
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

          <TouchableOpacity
            style={[styles.customFoodButton, { borderColor: accentColor }]}
            onPress={() => setShowCustomFoodModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={accentColor} />
            <Text style={[styles.customFoodButtonText, { color: accentColor }]}>Add Custom Food</Text>
          </TouchableOpacity>

          {showSearchResults && filteredFoods.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <FlatList
                data={filteredFoods}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => {
                      const foodWithBase = {
                        ...item,
                        baseCalories: item.calories,
                        baseProtein: item.protein,
                        baseCarbs: item.carbs,
                        baseFat: item.fat,
                      };
                      addFood(foodWithBase);
                    }}
                  >
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultName}>{item.name}</Text>
                      <Text style={styles.searchResultCategory}>
                        {item.category} • {item.servingSize}
                      </Text>
                      <Text style={styles.searchResultMacros}>
                        {item.calories} cal • {item.protein}g protein
                      </Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color={accentColor} />
                  </TouchableOpacity>
                )}
                style={styles.searchResultsList}
                nestedScrollEnabled
              />
            </View>
          )}

          {showSearchResults && filteredFoods.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No foods found</Text>
            </View>
          )}
        </View>

        {/* Selected Foods List */}
        <View style={styles.foodsList}>
          <Text style={styles.foodsListTitle}>
            Logged Foods ({selectedFoods.length} {selectedFoods.length === 1 ? 'item' : 'items'})
          </Text>

          {selectedFoods.length === 0 ? (
            <View style={styles.emptyFoodContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#6B7280" />
              <Text style={styles.emptyFoodText}>No foods logged yet</Text>
              <Text style={styles.emptyFoodSubtext}>Search and add foods to track your nutrition</Text>
            </View>
          ) : (
            selectedFoods.map((food) => (
              <View key={food.id} style={styles.foodCard}>
                <View style={styles.foodHeader}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodCategory}>{food.category}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFood(food.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.foodInputs}>
                  <View style={styles.unitSelector}>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        food.unit === 'servings' && { backgroundColor: accentColor },
                        food.unit !== 'servings' && styles.unitButtonInactive,
                      ]}
                      onPress={() => updateFood(food.id, 'unit', 'servings')}
                    >
                      <Text style={[
                        styles.unitButtonText,
                        food.unit === 'servings' && styles.unitButtonTextActive,
                        food.unit !== 'servings' && styles.unitButtonTextInactive,
                      ]}>
                        Servings
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        food.unit === 'weight' && { backgroundColor: accentColor },
                        food.unit !== 'weight' && styles.unitButtonInactive,
                      ]}
                      onPress={() => updateFood(food.id, 'unit', 'weight')}
                    >
                      <Text style={[
                        styles.unitButtonText,
                        food.unit === 'weight' && styles.unitButtonTextActive,
                        food.unit !== 'weight' && styles.unitButtonTextInactive,
                      ]}>
                        Weight (g)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.amountInput}>
                    <Text style={styles.inputLabel}>
                      {food.unit === 'servings' ? 'Servings' : 'Weight (g)'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      value={food.amount}
                      onChangeText={(value) => updateFood(food.id, 'amount', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.foodMacros}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Calories</Text>
                    <Text style={[styles.macroValue, { color: accentColor }]}>
                      {Math.round(food.calories || 0)}
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Protein</Text>
                    <Text style={[styles.macroValue, { color: '#10B981' }]}>
                      {Math.round(food.protein || 0)}g
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Carbs</Text>
                    <Text style={[styles.macroValue, { color: '#3B82F6' }]}>
                      {Math.round(food.carbs || 0)}g
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Fat</Text>
                    <Text style={[styles.macroValue, { color: '#F59E0B' }]}>
                      {Math.round(food.fat || 0)}g
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Custom Food Modal */}
      <Modal
        visible={showCustomFoodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomFoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Food</Text>
              <TouchableOpacity onPress={() => setShowCustomFoodModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Food Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Homemade Smoothie"
                  placeholderTextColor="#6B7280"
                  value={customFood.name}
                  onChangeText={(text) => setCustomFood({ ...customFood, name: text })}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Serving Size</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., 1 cup, 100g"
                  placeholderTextColor="#6B7280"
                  value={customFood.servingSize}
                  onChangeText={(text) => setCustomFood({ ...customFood, servingSize: text })}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Calories (per serving)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  value={customFood.calories}
                  onChangeText={(text) => setCustomFood({ ...customFood, calories: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Protein (g per serving)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  value={customFood.protein}
                  onChangeText={(text) => setCustomFood({ ...customFood, protein: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Carbs (g per serving)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  value={customFood.carbs}
                  onChangeText={(text) => setCustomFood({ ...customFood, carbs: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Fat (g per serving)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  value={customFood.fat}
                  onChangeText={(text) => setCustomFood({ ...customFood, fat: text })}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: '#374151' }]}
                onPress={() => setShowCustomFoodModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: accentColor }]}
                onPress={saveCustomFood}
              >
                <Text style={styles.modalSaveText}>Add Food</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
  pieChartsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  pieChartContainer: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  pieChart: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pieChartCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  pieChartInner: {
    transform: [{ rotate: '90deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChartPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  pieChartLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  pieChartValue: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  searchSection: {
    marginBottom: 24,
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
    marginBottom: 12,
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
  customFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: 'transparent',
    gap: 8,
  },
  customFoodButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
    marginBottom: 2,
  },
  searchResultMacros: {
    fontSize: 12,
    color: '#6B7280',
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
  foodsList: {
    marginTop: 8,
  },
  foodsListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  emptyFoodContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyFoodText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyFoodSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  foodCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  foodCategory: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  removeButton: {
    padding: 4,
  },
  foodInputs: {
    marginBottom: 16,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  unitButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#374151',
  },
  unitButtonInactive: {
    backgroundColor: '#111827',
  },
  unitButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  unitButtonTextInactive: {
    color: '#9CA3AF',
  },
  amountInput: {
    marginTop: 4,
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
  },
  foodMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  modalForm: {
    maxHeight: 400,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
