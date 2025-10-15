import { create } from 'zustand';
import { dailyHabitsService } from '../lib/dailyHabitsService';
import { pointsService } from '../lib/pointsService';
import { DailyHabits, CreateDailyHabitsData } from '../types/database';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';

interface ActionState {
	segmentChecked: boolean[];
	setSegmentChecked: (segments: boolean[]) => void;
	toggleSegment: (index: number) => void;
	getActiveSegmentCount: () => number;
	
	// Core habits state (5 segments for pink bar)
	coreHabitsCompleted: boolean[];
	setCoreHabitsCompleted: (segments: boolean[]) => void;
	loadCoreHabitsStatus: () => Promise<void>;
	trackCoreHabit: (habitType: 'like' | 'comment' | 'share' | 'update_goal') => Promise<void>;
	
	// Daily habits state
	dailyHabits: DailyHabits | null;
	dailyHabitsLoading: boolean;
	dailyHabitsError: string | null;
	selectedDate: string;
	shouldOpenGraphs: boolean;
	
	// Daily habits actions
	saveDailyHabits: (habitData: CreateDailyHabitsData) => Promise<boolean>;
	loadDailyHabits: (date: string) => Promise<void>;
	clearDailyHabitsError: () => void;
	clearHabitForDate: (date: string, habitType: string) => Promise<boolean>;
	setSelectedDate: (date: string) => void;
	syncSegmentsWithData: (dailyHabits: DailyHabits, pointsData?: { meditation_completed?: boolean; microlearn_completed?: boolean } | null) => void;
	setShouldOpenGraphs: (shouldOpen: boolean) => void;
	clearStore: () => void;
}

export const useActionStore = create<ActionState>((set, get) => ({
	segmentChecked: [false, false, false, false, false, false, false, false], // All segments start unchecked each day
	
	// Core habits state (Like, Comment, Share, Update Goal, Bonus)
	coreHabitsCompleted: [false, false, false, false, false],
	
	// Daily habits state
	dailyHabits: null,
	dailyHabitsLoading: false,
	dailyHabitsError: null,
	selectedDate: (() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  })(), // Yesterday's date as default
	shouldOpenGraphs: false,
	
	// Listen for auth changes and clear store when user logs out
	...(function() {
		// This runs once when the store is created
		const unsubscribe = useAuthStore.subscribe((state) => {
			if (!state.user) {
				// User logged out, clear the action store
				set({
					segmentChecked: [false, false, false, false, false, false, false, false],
					coreHabitsCompleted: [false, false, false, false, false],
					dailyHabits: null,
					dailyHabitsLoading: false,
					dailyHabitsError: null,
					selectedDate: new Date().toISOString().split('T')[0],
					shouldOpenGraphs: false
				});
			}
		});
		
		// Return empty object since we're just setting up the listener
		return {};
	})(),
	
	setSegmentChecked: (segments: boolean[]) => {
		set({ segmentChecked: segments });
	},
	
	toggleSegment: (index: number) => {
		set((state) => {
			const newSegments = [...state.segmentChecked];
			newSegments[index] = !newSegments[index];
			return { segmentChecked: newSegments };
		});
	},
	
	getActiveSegmentCount: () => {
		const state = get();
		return state.segmentChecked.filter(checked => checked).length;
	},
	
	setCoreHabitsCompleted: (segments: boolean[]) => {
		set({ coreHabitsCompleted: segments });
	},
	
	loadCoreHabitsStatus: async () => {
		try {
			const { user } = useAuthStore.getState();
			if (!user) return;
			
			const status = await pointsService.getCoreHabitsStatus(user.id);
			set({
				coreHabitsCompleted: [
					status.liked,
					status.commented,
					status.shared,
					status.updatedGoal,
					status.bonus
				]
			});
		} catch (error) {
			console.error('Error loading core habits status:', error);
		}
	},
	
	trackCoreHabit: async (habitType: 'like' | 'comment' | 'share' | 'update_goal') => {
		try {
			const { user } = useAuthStore.getState();
			if (!user) return;
			
			const success = await pointsService.trackCoreHabit(user.id, habitType);
			if (success) {
				// Reload status to update UI
				await get().loadCoreHabitsStatus();
			}
		} catch (error) {
			console.error('Error tracking core habit:', error);
		}
	},

	// Save daily habits to Supabase
	saveDailyHabits: async (habitData: CreateDailyHabitsData) => {
		set({ dailyHabitsLoading: true, dailyHabitsError: null });
		
		try {
			// Get current user ID
			const { user } = useAuthStore.getState();
			const userId = user?.id;
			
			if (!userId) {
				throw new Error('User not authenticated');
			}

			const result = await dailyHabitsService.upsertDailyHabits(userId, habitData.date, habitData);
			
			if (result) {
				set({ 
					dailyHabits: result, 
					dailyHabitsLoading: false,
					dailyHabitsError: null 
				});
				
				// Update points for the daily habits
				await pointsService.updateDailyHabitsPoints(userId, result, habitData.date);
				
				return true;
			} else {
				throw new Error('Failed to save daily habits');
			}
		} catch (error: any) {
			set({ 
				dailyHabitsError: error.message, 
				dailyHabitsLoading: false 
			});
			return false;
		}
	},

	// Load daily habits for a specific date
	loadDailyHabits: async (date: string) => {
		set({ dailyHabitsLoading: true, dailyHabitsError: null });
		
		try {
			// Get current user ID
			const { user } = useAuthStore.getState();
			const userId = user?.id;
			
			if (!userId) {
				throw new Error('User not authenticated');
			}

			const result = await dailyHabitsService.getDailyHabits(userId, date);
			
			// Also load meditation/microlearn status from user_points_daily
			const { data: pointsData } = await supabase
				.from('user_points_daily')
				.select('meditation_completed, microlearn_completed')
				.eq('user_id', userId)
				.eq('date', date)
				.single();
			
			set({ 
				dailyHabits: result, 
				dailyHabitsLoading: false,
				dailyHabitsError: null 
			});

			// Sync segments with loaded data (pass points data for meditation/microlearn)
			if (result) {
				get().syncSegmentsWithData(result, pointsData);
			}
		} catch (error: any) {
			set({ 
				dailyHabitsError: error.message, 
				dailyHabitsLoading: false 
			});
		}
	},

	// Clear a specific habit for a date
	clearHabitForDate: async (date: string, habitType: string) => {
		try {
			const { user } = useAuthStore.getState();
			const userId = user?.id;
			if (!userId) throw new Error('User not authenticated');
			
			const ok = await dailyHabitsService.clearHabit(userId, date, habitType);
			if (ok) {
				// Optionally refresh local state
				await get().loadDailyHabits(date);
			}
			return ok;
		} catch (error) {
			set({ dailyHabitsError: 'Failed to clear habit' });
			return false;
		}
	},

	// Clear daily habits error
	clearDailyHabitsError: () => {
		set({ dailyHabitsError: null });
	},

	// Set selected date
	setSelectedDate: (date: string) => {
		set({ selectedDate: date });
	},

	// Sync segments with loaded daily habits data
	syncSegmentsWithData: (dailyHabits: DailyHabits, pointsData?: { meditation_completed?: boolean; microlearn_completed?: boolean } | null) => {
		const segments = new Array(8).fill(false);
		
		// Check meditation and microlearn from points data
		segments[0] = pointsData?.meditation_completed || false; // Meditation (index 0)
		segments[1] = pointsData?.microlearn_completed || false; // Micro-learn (index 1)
		
		if (dailyHabits?.sleep_hours || dailyHabits?.sleep_quality) {
			segments[2] = true; // Sleep (index 2)
		}
		if (dailyHabits?.water_intake) {
			segments[3] = true; // Water (index 3)
		}
		if (dailyHabits?.run_day_type || dailyHabits?.run_activity_type) {
			segments[4] = true; // Run (index 4)
		}
		if (dailyHabits?.reflect_mood || dailyHabits?.reflect_energy || dailyHabits?.reflect_what_went_well) {
			segments[5] = true; // Reflect (index 5)
		}
		if (dailyHabits?.cold_shower_completed) {
			segments[6] = true; // Cold Shower (index 6)
		}
		if (dailyHabits?.gym_day_type || dailyHabits?.gym_training_types) {
			segments[7] = true; // Gym (index 7)
		}
		
		set({ segmentChecked: segments });
	},
	
	setShouldOpenGraphs: (shouldOpen: boolean) => {
		set({ shouldOpenGraphs: shouldOpen });
	},
	
	clearStore: () => {
		set({
			segmentChecked: [false, false, false, false, false, false, false, false],
			coreHabitsCompleted: [false, false, false, false, false],
			dailyHabits: null,
			dailyHabitsLoading: false,
			dailyHabitsError: null,
			selectedDate: (() => {
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				return yesterday.toISOString().split('T')[0];
			})(),
			shouldOpenGraphs: false
		});
	},
})); 