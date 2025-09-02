import { create } from 'zustand';
import { dailyHabitsService } from '../lib/dailyHabitsService';
import { DailyHabits, CreateDailyHabitsData } from '../types/database';
import { useAuthStore } from './authStore';

interface ActionState {
	segmentChecked: boolean[];
	setSegmentChecked: (segments: boolean[]) => void;
	toggleSegment: (index: number) => void;
	getActiveSegmentCount: () => number;
	
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
	syncSegmentsWithData: (dailyHabits: DailyHabits) => void;
	setShouldOpenGraphs: (shouldOpen: boolean) => void;
}

export const useActionStore = create<ActionState>((set, get) => ({
	segmentChecked: [false, false, false, false, false, false, false, false], // All segments start unchecked each day
	
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
			
			set({ 
				dailyHabits: result, 
				dailyHabitsLoading: false,
				dailyHabitsError: null 
			});

			// Sync segments with loaded data
			if (result) {
				get().syncSegmentsWithData(result);
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
	syncSegmentsWithData: (dailyHabits: DailyHabits) => {
		const segments = new Array(8).fill(false);
		
		// Check which habits are completed based on loaded data
		// Note: Meditation (index 0) and Micro-learn (index 1) don't store data in DB
		// They should always start as false (uncompleted) for each new day
		segments[0] = false; // Meditation - always fresh each day
		segments[1] = false; // Micro-learn - always fresh each day
		
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
})); 