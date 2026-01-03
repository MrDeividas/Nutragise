import { create } from 'zustand';
import { dailyHabitsService } from '../lib/dailyHabitsService';
import { pointsService } from '../lib/pointsService';
import {
  DailyHabits,
  CreateDailyHabitsData,
  CustomHabit,
  CustomHabitCompletion,
  CreateCustomHabitInput,
} from '../types/database';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';
import { habitsService } from '../lib/habitsService';

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

	// Custom habits
	customHabits: CustomHabit[];
	customHabitsLoading: boolean;
	customHabitsError: string | null;
	customHabitsDate: string;
	habitCompletions: Record<string, CustomHabitCompletion | undefined>;
	loadCustomHabits: (date?: string) => Promise<void>;
	createCustomHabit: (payload: CreateCustomHabitInput) => Promise<CustomHabit | null>;
	updateCustomHabit: (habitId: string, payload: Partial<CreateCustomHabitInput>) => Promise<CustomHabit | null>;
	deleteCustomHabit: (habitId: string) => Promise<boolean>;
	checkHabitPartnerships: (habitId: string) => Promise<any[]>;
	toggleHabitCompletion: (habitId: string, occurDate: string) => Promise<void>;
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

	// Custom habits
	customHabits: [],
	customHabitsLoading: false,
	customHabitsError: null,
	customHabitsDate: new Date().toISOString().split('T')[0],
	habitCompletions: {},
	
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
					shouldOpenGraphs: false,
					customHabits: [],
					customHabitsLoading: false,
					customHabitsError: null,
					customHabitsDate: new Date().toISOString().split('T')[0],
					habitCompletions: {},
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

				const updatedHabits = get().dailyHabits;
				await pointsService.updateDailyHabitsPoints(
					userId,
					(updatedHabits ?? {}) as DailyHabits,
					date
				);
			}
			return ok;
		} catch (error) {
			set({ dailyHabitsError: 'Failed to clear habit' });
			return false;
		}
	},

	loadCustomHabits: async (date?: string) => {
		set({ customHabitsLoading: true, customHabitsError: null });

		try {
			const { user } = useAuthStore.getState();
			if (!user) throw new Error('User not authenticated');

			const targetDate = date ?? get().customHabitsDate ?? new Date().toISOString().split('T')[0];
			const [habits, completions] = await Promise.all([
				habitsService.fetchHabits(user.id),
				habitsService.fetchCompletions(user.id, targetDate),
			]);

			const completionMap: Record<string, CustomHabitCompletion | undefined> = {};
			completions.forEach((entry) => {
				completionMap[entry.habit_id] = entry;
			});

			set({
				customHabits: habits,
				customHabitsLoading: false,
				customHabitsError: null,
				customHabitsDate: targetDate,
				habitCompletions: completionMap,
			});
		} catch (error: any) {
			set({
				customHabitsLoading: false,
				customHabitsError: error.message ?? 'Failed to load habits',
			});
		}
	},

	createCustomHabit: async (payload: CreateCustomHabitInput) => {
		try {
			const { user } = useAuthStore.getState();
			if (!user) throw new Error('User not authenticated');

			const habit = await habitsService.createHabit(user.id, payload);
			set((state) => ({
				customHabits: [...state.customHabits, habit],
			}));

			return habit;
		} catch (error: any) {
			set({
				customHabitsError: error.message ?? 'Failed to create habit',
			});
			return null;
		}
	},

	updateCustomHabit: async (habitId: string, payload: Partial<CreateCustomHabitInput>) => {
		try {
			const { user } = useAuthStore.getState();
			if (!user) throw new Error('User not authenticated');

			const updated = await habitsService.updateHabit(user.id, habitId, payload);
			set((state) => ({
				customHabits: state.customHabits.map((h) => (h.id === habitId ? updated : h)),
			}));

			return updated;
		} catch (error: any) {
			set({
				customHabitsError: error.message ?? 'Failed to update habit',
			});
			return null;
		}
	},

	deleteCustomHabit: async (habitId: string) => {
		try {
			const { user } = useAuthStore.getState();
			if (!user) throw new Error('User not authenticated');

			await habitsService.deleteHabit(user.id, habitId);
			set((state) => ({
				customHabits: state.customHabits.filter((h) => h.id !== habitId),
			}));

			return true;
		} catch (error: any) {
			set({
				customHabitsError: error.message ?? 'Failed to delete habit',
			});
			return false;
		}
	},
	
	// Check if habit has partnerships before deletion
	checkHabitPartnerships: async (habitId: string) => {
		try {
			const { user } = useAuthStore.getState();
			if (!user) return [];
			
			return await habitsService.getActivePartnerships(user.id, habitId);
		} catch (error) {
			console.error('Error checking partnerships:', error);
			return [];
		}
	},

	toggleHabitCompletion: async (habitId: string, occurDate: string) => {
		try {
			const { user } = useAuthStore.getState();
			if (!user) throw new Error('User not authenticated');

			const state = get();
			const habit = state.customHabits.find(h => h.id === habitId);
			if (!habit) throw new Error('Habit not found');

			const frequency = (habit.metadata as any)?.frequency ?? 1;
			const completions = { ...state.habitCompletions };
			const existing = completions[habitId];
			const currentCount = existing?.value ?? (existing ? 1 : 0);

			// Cycle through: 0 -> 1 -> 2 -> ... -> frequency -> 0
			let newCount: number;
			if (currentCount >= frequency) {
				// Reset to 0 by deleting the completion
				await habitsService.deleteCompletion(user.id, habitId, occurDate);
				delete completions[habitId];
			} else {
				// Increment the count
				newCount = currentCount + 1;
				const entry = await habitsService.upsertCompletion(user.id, {
					habit_id: habitId,
					occur_date: occurDate,
					status: 'completed',
					value: newCount,
				});
				completions[habitId] = entry;
			}

			set({ habitCompletions: completions });
		} catch (error: any) {
			set({
				customHabitsError: error.message ?? 'Failed to toggle habit',
			});
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
			shouldOpenGraphs: false,
			customHabits: [],
			customHabitsLoading: false,
			customHabitsError: null,
			customHabitsDate: new Date().toISOString().split('T')[0],
			habitCompletions: {},
		});
	},
})); 