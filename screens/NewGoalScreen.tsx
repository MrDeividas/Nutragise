import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGoalsStore } from '../state/goalsStore';
import { CreateGoalData } from '../types/database';

interface NewGoalScreenProps {
  navigation: any;
}

const CATEGORIES = [
  'Fitness',
  'Health',
  'Nutrition',
  'Weight Loss',
  'Muscle Gain',
  'Endurance',
  'Habits',
  'Other'
];

export default function NewGoalScreen({ navigation }: NewGoalScreenProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  const { createGoal, loading, error } = useGoalsStore();

  const handleCreateGoal = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    const goalData: CreateGoalData = {
      title: title.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      end_date: endDate || undefined,
    };

    const newGoal = await createGoal(goalData);
    if (newGoal) {
      Alert.alert('Success', 'Goal created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else if (error) {
      Alert.alert('Error', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleDateChange = (text: string) => {
    // Simple date validation (YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (text === '' || dateRegex.test(text)) {
      setEndDate(text);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">New Goal</Text>
          <TouchableOpacity
            onPress={handleCreateGoal}
            disabled={loading || !title.trim()}
            className={`px-4 py-2 rounded-lg ${
              loading || !title.trim() 
                ? 'bg-gray-300' 
                : 'bg-blue-500'
            }`}
          >
            <Text className={`font-medium ${
              loading || !title.trim() 
                ? 'text-gray-500' 
                : 'text-white'
            }`}>
              {loading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* Title Input */}
          <View className="mb-6">
            <Text className="text-base font-medium text-gray-900 mb-2">
              Goal Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What do you want to achieve?"
              className="w-full p-4 border border-gray-300 rounded-lg text-base"
              multiline={false}
              maxLength={100}
            />
            <Text className="text-sm text-gray-500 mt-1">
              {title.length}/100 characters
            </Text>
          </View>

          {/* Description Input */}
          <View className="mb-6">
            <Text className="text-base font-medium text-gray-900 mb-2">
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your goal in detail..."
              className="w-full p-4 border border-gray-300 rounded-lg text-base min-h-[100px]"
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text className="text-sm text-gray-500 mt-1">
              {description.length}/500 characters
            </Text>
          </View>

          {/* Category Selection */}
          <View className="mb-6">
            <Text className="text-base font-medium text-gray-900 mb-2">
              Category
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategories(!showCategories)}
              className="w-full p-4 border border-gray-300 rounded-lg flex-row items-center justify-between"
            >
              <Text className={`text-base ${category ? 'text-gray-900' : 'text-gray-500'}`}>
                {category || 'Select a category'}
              </Text>
              <Ionicons 
                name={showCategories ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6b7280" 
              />
            </TouchableOpacity>
            
            {showCategories && (
              <View className="mt-2 border border-gray-300 rounded-lg">
                {CATEGORIES.map((cat, index) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategories(false);
                    }}
                    className={`p-4 ${index < CATEGORIES.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <Text className={`text-base ${category === cat ? 'text-blue-500 font-medium' : 'text-gray-900'}`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Target Date Input */}
          <View className="mb-6">
            <Text className="text-base font-medium text-gray-900 mb-2">
              Target Date
            </Text>
            <TextInput
              value={endDate}
              onChangeText={handleDateChange}
              placeholder="YYYY-MM-DD (optional)"
              className="w-full p-4 border border-gray-300 rounded-lg text-base"
              maxLength={10}
            />
            <Text className="text-sm text-gray-500 mt-1">
              Optional: Set a target completion date
            </Text>
            {endDate && (
              <Text className="text-sm text-blue-500 mt-1">
                Target: {formatDate(endDate)}
              </Text>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4 p-4 bg-red-50 rounded-lg">
              <Text className="text-red-600 text-center">{error}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 