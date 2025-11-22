import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Platform, I18nManager, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { ThemeProvider, useTheme } from './ThemeContext';
import { WorkoutProvider } from './WorkoutContext';
import { NutritionGoalsProvider } from './NutritionGoalsContext';
import { WeightProvider } from './WeightContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import TrainingScreen from './screens/TrainingScreen';
import NutritionScreen from './screens/NutritionScreen';
import PersonalTrainerScreen from './screens/PersonalTrainerScreen';
import HealthScreen from './screens/HealthScreen';
import ProfileScreen from './screens/ProfileScreen';

// Configure axios base URL to your backend. 
// For web/simulator: use localhost
// For physical device: use your computer's local IP address (e.g., http://192.168.1.100:3000)
// To find your IP: Windows: ipconfig | findstr IPv4, Mac/Linux: ifconfig or ip addr
const API_BASE_URL = __DEV__ 
  ? (Platform?.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.68.72:3000')  // Change IP for physical device
  : 'http://localhost:3000';      // Production URL

axios.defaults.baseURL = API_BASE_URL;
console.log('API Base URL configured:', API_BASE_URL);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LoadingScreen() {
  const { backgroundColor, accentColor } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}>
      <ActivityIndicator size="large" color={accentColor} />
    </View>
  );
}

function MainTabs({ user }) {
  const { accentColor } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        // Special styling for Personal Trainer tab
        const isPersonalTrainer = route.name === 'PersonalTrainer';
        
        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1F2937',
            borderTopColor: '#374151',
            borderTopWidth: 1,
            height: isPersonalTrainer ? 70 : 60,
            paddingBottom: isPersonalTrainer ? 8 : 5,
            paddingTop: 5,
          },
          tabBarActiveTintColor: accentColor,
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Training') {
              iconName = focused ? 'barbell' : 'barbell-outline';
            } else if (route.name === 'Nutrition') {
              iconName = focused ? 'nutrition' : 'nutrition-outline';
            } else if (route.name === 'PersonalTrainer') {
              iconName = 'fitness';
            } else if (route.name === 'Health') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }
            
            // Special styling for Personal Trainer icon
            if (isPersonalTrainer) {
              return (
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: focused ? accentColor : '#374151',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: -8,
                    shadowColor: focused ? accentColor : '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: focused ? 0.5 : 0.2,
                    shadowRadius: 8,
                    elevation: 6,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={require('./assets/logo.png')}
                    style={{
                      width: 56,
                      height: 56,
                      resizeMode: 'cover',
                    }}
                  />
                </View>
              );
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarLabel: isPersonalTrainer ? '' : undefined, // Hide label for Personal Trainer
        };
      }}
    >
      <Tab.Screen name="Training">
        {() => <TrainingScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Nutrition">
        {() => <NutritionScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen 
        name="PersonalTrainer"
        options={{
          tabBarLabel: '',
        }}
      >
        {() => <PersonalTrainerScreen />}
      </Tab.Screen>
      <Tab.Screen name="Health">
        {() => <HealthScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {() => <ProfileScreen user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Force LTR (left-to-right) layout on mount
  useEffect(() => {
    try {
      if (I18nManager.isRTL) {
        I18nManager.forceRTL(false);
        I18nManager.allowRTL(false);
        I18nManager.swapLeftAndRightInRTL(false);
        // On Android, need to restart app for changes to take effect
        if (Platform.OS === 'android') {
          // Note: This requires app restart on Android
        }
      }
    } catch (error) {
      console.warn('I18nManager error:', error);
    }
  }, []);

  // Simulate loading user from async storage or API
  useEffect(() => {
    const fetchUser = async () => {
      // In a real app we would load persisted user data here
      setLoading(false);
    };
    fetchUser();
  }, []);

  return (
    <ThemeProvider>
      <WorkoutProvider>
        <NutritionGoalsProvider>
          <WeightProvider>
            {loading ? (
              <LoadingScreen />
            ) : (
              <NavigationContainer>
                <Stack.Navigator 
                  screenOptions={{ 
                    headerShown: false,
                    animation: 'default',
                  }}
                >
                  {user ? (
                    <>
                      <Stack.Screen name="Main">
                        {() => <MainTabs user={user} />}
                      </Stack.Screen>
                      <Stack.Screen name="Home">
                        {() => <HomeScreen user={user} />}
                      </Stack.Screen>
                    </>
                  ) : (
                    <>
                      <Stack.Screen name="Login">
                        {({ navigation }) => <LoginScreen navigation={navigation} onLogin={setUser} />}
                      </Stack.Screen>
                      <Stack.Screen name="Register">
                        {({ navigation }) => <RegisterScreen navigation={navigation} onLogin={setUser} />}
                      </Stack.Screen>
                    </>
                  )}
                </Stack.Navigator>
              </NavigationContainer>
            )}
          </WeightProvider>
        </NutritionGoalsProvider>
      </WorkoutProvider>
    </ThemeProvider>
  );
}