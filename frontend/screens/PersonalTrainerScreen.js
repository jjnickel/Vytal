import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import { useNutritionGoals } from '../NutritionGoalsContext';

export default function PersonalTrainerScreen({ user }) {
  const { accentColor, backgroundColor } = useTheme();
  const { user: authUser } = useAuth();
  const { goals } = useNutritionGoals();
  const navigation = useNavigation();
  const activeUser = user || authUser;

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: `Hey${activeUser?.name ? `, ${activeUser.name.split(' ')[0]}` : ''}! I'm your AI Personal Trainer. I'm here to help you with workouts, nutrition, form checks, and motivation. What would you like to work on today?`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const getUserContext = () => ({
    name: activeUser?.name,
    goals: goals
      ? {
          calories: goals.calories,
          protein: goals.protein,
          carbs: goals.carbs,
          fat: goals.fat,
        }
      : null,
  });

  const buildApiMessages = (currentMessages) =>
    currentMessages
      .filter((m) => m.sender !== 'system')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

  const sendMessage = async (text, imageAnalysis = false) => {
    if (!text.trim() && !imageAnalysis) return;

    const userMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const updatedMessages = [...messages, userMessage];
      const response = await axios.post('/api/trainer/chat', {
        messages: buildApiMessages(updatedMessages),
        userContext: getUserContext(),
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.message,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: error.response?.status === 503
          ? 'AI service is not configured. Please add your OPENAI_API_KEY to the backend .env file.'
          : 'Sorry, I had trouble connecting. Please check that the backend server is running and try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(inputText);

  const handleImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload images for form analysis.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const userMessage = {
      id: Date.now().toString(),
      text: '📸 [Photo uploaded for form analysis]',
      sender: 'user',
      timestamp: new Date(),
      isImage: true,
      imageUri: asset.uri,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const mimeType = asset.type === 'image' ? 'image/jpeg' : asset.mimeType || 'image/jpeg';
      const response = await axios.post('/api/trainer/analyze-image', {
        imageBase64: asset.base64,
        mimeType,
        prompt: 'Please analyze this image and provide fitness coaching feedback on form, technique, posture, or any relevant fitness observations.',
        userContext: getUserContext(),
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.message,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Image analysis error:', error);
      const errMsg = {
        id: (Date.now() + 1).toString(),
        text: error.response?.status === 503
          ? 'AI service is not configured. Please add your OPENAI_API_KEY to the backend .env file.'
          : 'Sorry, I could not analyze the image. Please ensure the backend server is running.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraUpload = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take photos for form analysis.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const userMessage = {
      id: Date.now().toString(),
      text: '📸 [Photo taken for form analysis]',
      sender: 'user',
      timestamp: new Date(),
      isImage: true,
      imageUri: asset.uri,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post('/api/trainer/analyze-image', {
        imageBase64: asset.base64,
        mimeType: 'image/jpeg',
        prompt: 'Please analyze my exercise form and provide specific, actionable coaching feedback.',
        userContext: getUserContext(),
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.message,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Camera image error:', error);
      const errMsg = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I could not analyze the photo. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <Image source={require('../assets/logo2.png')} style={styles.bannerLogo} resizeMode="contain" />
      </View>

      {/* Home Button */}
      <View style={styles.homeButtonWrapper}>
        <TouchableOpacity
          style={[styles.homeButton, { backgroundColor: '#1F2937', borderColor: accentColor }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home" size={20} color={accentColor} />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={[styles.avatarContainer, { backgroundColor: accentColor }]}>
            <Ionicons name="fitness" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>AI Personal Trainer</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.headerSubtitle}>Online & ready to help</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.sender === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.sender === 'user'
                  ? [styles.userBubble, { backgroundColor: accentColor }]
                  : styles.aiBubble,
              ]}
            >
              {message.isImage && message.imageUri && (
                <Image
                  source={{ uri: message.imageUri }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              )}
              <Text
                style={[
                  styles.messageText,
                  message.sender === 'user' ? styles.userMessageText : styles.aiMessageText,
                ]}
              >
                {message.text}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  message.sender === 'user' ? styles.userTimestamp : styles.aiTimestamp,
                ]}
              >
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
            <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color={accentColor} />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.uploadButtons}>
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: accentColor }]}
            onPress={handleImageUpload}
            disabled={isLoading}
          >
            <Ionicons name="image-outline" size={20} color={isLoading ? '#6B7280' : accentColor} />
            <Text style={[styles.uploadButtonText, { color: isLoading ? '#6B7280' : accentColor }]}>
              Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: accentColor }]}
            onPress={handleCameraUpload}
            disabled={isLoading}
          >
            <Ionicons name="camera-outline" size={20} color={isLoading ? '#6B7280' : accentColor} />
            <Text style={[styles.uploadButtonText, { color: isLoading ? '#6B7280' : accentColor }]}>
              Camera
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask your trainer anything..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() && !isLoading ? accentColor : '#374151' },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  bannerLogo: { width: 120, height: 40 },
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
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: -0.3,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  headerSubtitle: { fontSize: 13, color: '#9CA3AF' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20, paddingBottom: 10 },
  messageWrapper: { marginBottom: 16 },
  userMessageWrapper: { alignItems: 'flex-end' },
  aiMessageWrapper: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 18 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderBottomLeftRadius: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  typingText: { color: '#9CA3AF', fontSize: 14 },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
  },
  messageText: { fontSize: 15, lineHeight: 22, letterSpacing: 0.2 },
  userMessageText: { color: '#FFFFFF' },
  aiMessageText: { color: '#E5E7EB' },
  timestamp: { fontSize: 11, marginTop: 6 },
  userTimestamp: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  aiTimestamp: { color: '#9CA3AF', textAlign: 'left' },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#111827',
  },
  uploadButtons: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  uploadButtonText: { fontSize: 14, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  textInput: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F9FAFB',
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
