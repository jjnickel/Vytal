import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import axios from 'axios';
import { useTheme } from '../ThemeContext';

export default function RegisterScreen({ navigation, onLogin }) {
  const { accentColor, backgroundColor } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Clear any previous errors
    setError('');
    
    if (!name || !email || !password) {
      const errorMsg = 'Please fill in all fields';
      setError(errorMsg);
      Alert.alert('Missing info', errorMsg);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Attempting registration for:', email);
      const res = await axios.post('/auth/register', { name, email, password });
      console.log('Registration response:', res.data);
      // Automatically log in the user after successful registration
      if (onLogin && res.data && res.data.user) {
        onLogin(res.data.user);
      } else {
        Alert.alert('Success', 'Registration complete. You can now log in.');
        navigation.goBack();
      }
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Determine error message
      let errorMessage = 'An error occurred';
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else if (err.response?.status === 409) {
        errorMessage = err.response?.data?.error || 'An account with this email already exists.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.error || 'Invalid request. Please check your input.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and start your fitness journey</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity 
              style={[
                styles.registerButton, 
                { backgroundColor: accentColor, shadowColor: accentColor },
                loading && styles.registerButtonDisabled
              ]} 
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.link, { color: accentColor }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 12,
    letterSpacing: -1,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '500',
  },
  registerButton: {
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
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#991B1B',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
});