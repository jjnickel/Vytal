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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';

export default function PersonalTrainerScreen() {
  const { accentColor, backgroundColor } = useTheme();
  const navigation = useNavigation();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hey! I'm your AI Personal Trainer. I'm here to help you with workouts, form checks, nutrition advice, and motivation. What would you like to work on today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Simulate AI response (will be replaced with GPT API later)
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for your message! I'm here to help. (AI response will be implemented with GPT API)",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleImageUpload = () => {
    // TODO: Implement image upload functionality
    console.log('Image upload pressed - to be implemented');
    // This will open image picker and send to GPT API
  };

  const handleVideoUpload = () => {
    // TODO: Implement video upload functionality
    console.log('Video upload pressed - to be implemented');
    // This will open video picker and send to GPT API
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <Image
          source={require('../assets/logo2.png')}
          style={styles.bannerLogo}
          resizeMode="contain"
        />
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
            <Text style={styles.headerSubtitle}>Always here to help</Text>
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
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        {/* Upload Buttons */}
        <View style={styles.uploadButtons}>
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: accentColor }]}
            onPress={handleImageUpload}
          >
            <Ionicons name="image-outline" size={20} color={accentColor} />
            <Text style={[styles.uploadButtonText, { color: accentColor }]}>Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: accentColor }]}
            onPress={handleVideoUpload}
          >
            <Ionicons name="videocam-outline" size={20} color={accentColor} />
            <Text style={[styles.uploadButtonText, { color: accentColor }]}>Video</Text>
          </TouchableOpacity>
        </View>

        {/* Text Input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask your trainer anything..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: accentColor }]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  header: {
    paddingTop: 80, // Space for banner (60px) + spacing
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  aiMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#E5E7EB',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#9CA3AF',
    textAlign: 'left',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#111827',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

