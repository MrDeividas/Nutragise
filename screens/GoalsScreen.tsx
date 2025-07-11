import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGoalsStore } from '../state/goalsStore';
import { useAuthStore } from '../state/authStore';
import { Goal } from '../types/database';

interface GoalsScreenProps {
  navigation: any;
}

export default function GoalsScreen({ navigation }: GoalsScreenProps) {
  const { user } = useAuthStore();
  const { goals, loading, error, fetchGoals, toggleGoalCompletion, deleteGoal } = useGoalsStore();

  useEffect(() => {
    if (user) {
      fetchGoals(user.id);
    }
  }, [user]);

  const handleRefresh = () => {
    if (user) {
      fetchGoals(user.id);
    }
  };

  const handleToggleCompletion = async (goalId: string) => {
    await toggleGoalCompletion(goalId);
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteGoal(goal.id)
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getDaysUntilTarget = (endDate: string) => {
    const target = new Date(endDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderGoalItem = ({ item: goal }: { item: Goal }) => {
    const daysUntilTarget = goal.end_date ? getDaysUntilTarget(goal.end_date) : null;
    
    return (
      <View className="bg-white mx-4 mb-4 p-4 rounded-lg shadow-sm border border-gray-200">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className={`text-lg font-semibold ${goal.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
              {goal.title}
            </Text>
            {goal.category && (
              <View className="mt-1">
                <Text className="text-sm text-blue-600 font-medium">
                  {goal.category}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center ml-2">
            <TouchableOpacity
              onPress={() => handleToggleCompletion(goal.id)}
              className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                goal.completed 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-gray-300'
              }`}
            >
              {goal.completed && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteGoal(goal)}
              className="ml-3 p-1"
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {goal.description && (
          <Text className="text-gray-600 mb-2 leading-5">
            {goal.description}
          </Text>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-500">
            Started: {formatDate(goal.start_date)}
          </Text>
          {goal.end_date && (
            <Text className={`text-sm font-medium ${
              daysUntilTarget !== null && daysUntilTarget < 0 
                ? 'text-red-500' 
                : daysUntilTarget !== null && daysUntilTarget <= 7 
                ? 'text-orange-500' 
                : 'text-gray-600'
            }`}>
              {daysUntilTarget !== null && daysUntilTarget < 0 
                ? `${Math.abs(daysUntilTarget)} days overdue`
                : daysUntilTarget !== null && daysUntilTarget === 0
                ? 'Due today'
                : daysUntilTarget !== null && daysUntilTarget === 1
                ? '1 day left'
                : daysUntilTarget !== null
                ? `${daysUntilTarget} days left`
                : 'No target date'
              }
            </Text>
          )}
        </View>

        {goal.completed && (
          <View className="mt-2 pt-2 border-t border-gray-200">
            <Text className="text-sm text-green-600 font-medium">
              ✅ Completed
            </Text>
          </View>
        )}
      </View>
    );
  };

  const activeGoals = goals.filter(goal => !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">My Goals</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewGoal')}
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-medium ml-1">New Goal</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats */}
        <View className="flex-row mt-4 space-x-4">
          <View className="flex-1 bg-blue-50 p-3 rounded-lg">
            <Text className="text-blue-600 font-semibold text-lg">{activeGoals.length}</Text>
            <Text className="text-blue-600 text-sm">Active</Text>
          </View>
          <View className="flex-1 bg-green-50 p-3 rounded-lg">
            <Text className="text-green-600 font-semibold text-lg">{completedGoals.length}</Text>
            <Text className="text-green-600 text-sm">Completed</Text>
          </View>
          <View className="flex-1 bg-gray-50 p-3 rounded-lg">
            <Text className="text-gray-600 font-semibold text-lg">{goals.length}</Text>
            <Text className="text-gray-600 text-sm">Total</Text>
          </View>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View className="mx-4 mt-4 p-4 bg-red-50 rounded-lg">
          <Text className="text-red-600 text-center">{error}</Text>
        </View>
      )}

      {/* Goals List */}
      <FlatList
        data={[...activeGoals, ...completedGoals]}
        keyExtractor={(item) => item.id}
        renderItem={renderGoalItem}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-16">
            <Ionicons name="trophy-outline" size={64} color="#d1d5db" />
            <Text className="text-xl font-medium text-gray-500 mt-4 mb-2">
              No Goals Yet
            </Text>
            <Text className="text-gray-400 text-center px-8 mb-6">
              Start your journey by creating your first goal
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('NewGoal')}
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-medium">Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
} 