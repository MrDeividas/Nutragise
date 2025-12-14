export interface Exercise {
  name: string;
  sets: number;
  reps: string; // e.g., "8-12" or "5-8" or "10-15"
}

export interface WorkoutSplitDay {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface PremadeWorkoutSplit {
  name: string;
  frequency: string;
  days: WorkoutSplitDay[];
}

// Helper function to get sets and reps for exercises based on exercise type
export function getExerciseSetsReps(exerciseName: string): { sets: number; reps: string } {
  const name = exerciseName.toLowerCase();
  
  // Major compound movements - strength focus
  if (name.includes('squat') || name.includes('deadlift') || name.includes('bench press')) {
    return { sets: 4, reps: '5-8' };
  }
  
  // Secondary compound movements
  if (name.includes('row') || name.includes('press') || name.includes('pull') || 
      name.includes('pulldown') || name.includes('shoulder press') || name.includes('overhead')) {
    return { sets: 4, reps: '8-12' };
  }
  
  // Leg movements
  if (name.includes('leg press') || name.includes('leg extension') || 
      name.includes('hamstring') || name.includes('leg curl') || name.includes('lunge') ||
      name.includes('romanian deadlift') || name.includes('hip thrust') || name.includes('glute')) {
    return { sets: 3, reps: '10-15' };
  }
  
  // Isolation exercises (arms, shoulders)
  if (name.includes('curl') || name.includes('triceps') || name.includes('biceps') ||
      name.includes('lateral') || name.includes('raise') || name.includes('fly') ||
      name.includes('dips') || name.includes('pushdown') || name.includes('extension') ||
      name.includes('skull') || name.includes('shrug') || name.includes('face pull')) {
    return { sets: 3, reps: '10-15' };
  }
  
  // Chest exercises
  if (name.includes('chest') || name.includes('incline') || name.includes('fly')) {
    return { sets: 3, reps: '8-12' };
  }
  
  // Calf exercises
  if (name.includes('calf')) {
    return { sets: 4, reps: '12-20' };
  }
  
  // Core work
  if (name.includes('core')) {
    return { sets: 3, reps: '10-20' };
  }
  
  // Push-ups
  if (name.includes('push-up') || name.includes('pushup')) {
    return { sets: 3, reps: '10-15' };
  }
  
  // Default for any other exercises
  return { sets: 3, reps: '8-12' };
}

// Helper to convert string array to Exercise array
function createExercises(exerciseNames: string[]): Exercise[] {
  return exerciseNames.map(name => ({
    name,
    ...getExerciseSetsReps(name)
  }));
}

export const PREMADE_WORKOUT_SPLITS: PremadeWorkoutSplit[] = [
  {
    name: "Full Body",
    frequency: "3 days/week",
    days: [
      {
        day: "Day 1",
        focus: "Full Body",
        exercises: createExercises([
          "Squat",
          "Bench Press",
          "Deadlift",
          "Pull-ups",
          "Shoulder Press",
          "Core Work"
        ])
      },
      {
        day: "Day 2",
        focus: "Full Body",
        exercises: createExercises([
          "Leg Press",
          "Incline Dumbbell Press",
          "Barbell Row",
          "Lateral Raises",
          "Hamstring Curls",
          "Core Work"
        ])
      },
      {
        day: "Day 3",
        focus: "Full Body",
        exercises: createExercises([
          "Lunges",
          "Chest Fly",
          "Lat Pulldown",
          "Dumbbell Shoulder Press",
          "Triceps Extensions",
          "Biceps Curls"
        ])
      }
    ]
  },
  {
    name: "Upper Lower",
    frequency: "4 days/week",
    days: [
      {
        day: "Day 1",
        focus: "Upper Body",
        exercises: createExercises([
          "Bench Press",
          "Barbell Row",
          "Overhead Press",
          "Pull-ups",
          "Biceps Curls",
          "Triceps Pushdowns"
        ])
      },
      {
        day: "Day 2",
        focus: "Lower Body",
        exercises: createExercises([
          "Squat",
          "Romanian Deadlift",
          "Leg Press",
          "Calf Raises",
          "Hamstring Curls",
          "Core Work"
        ])
      },
      {
        day: "Day 3",
        focus: "Upper Body",
        exercises: createExercises([
          "Incline Press",
          "Lat Pulldown",
          "Dumbbell Shoulder Press",
          "Cable Row",
          "Lateral Raises",
          "Face Pulls"
        ])
      },
      {
        day: "Day 4",
        focus: "Lower Body",
        exercises: createExercises([
          "Deadlift",
          "Front Squat",
          "Leg Extensions",
          "Glute Bridges",
          "Calf Raises",
          "Core Work"
        ])
      }
    ]
  },
  {
    name: "Push Pull Legs (PPL)",
    frequency: "3-6 days/week",
    days: [
      {
        day: "Day 1",
        focus: "Push",
        exercises: createExercises([
          "Bench Press",
          "Incline Dumbbell Press",
          "Shoulder Press",
          "Lateral Raises",
          "Triceps Dips",
          "Triceps Rope Pushdowns"
        ])
      },
      {
        day: "Day 2",
        focus: "Pull",
        exercises: createExercises([
          "Deadlift",
          "Pull-ups",
          "Barbell Row",
          "Lat Pulldown",
          "Rear Delt Fly",
          "Biceps Curls"
        ])
      },
      {
        day: "Day 3",
        focus: "Legs",
        exercises: createExercises([
          "Squat",
          "Leg Press",
          "Romanian Deadlift",
          "Hamstring Curls",
          "Calf Raises",
          "Core Work"
        ])
      }
    ]
  },
  {
    name: "Arnold Split",
    frequency: "6 days/week",
    days: [
      {
        day: "Day 1",
        focus: "Chest & Back",
        exercises: createExercises([
          "Bench Press",
          "Chest Fly",
          "Pull-ups",
          "Barbell Row",
          "Lat Pulldown"
        ])
      },
      {
        day: "Day 2",
        focus: "Shoulders & Arms",
        exercises: createExercises([
          "Shoulder Press",
          "Lateral Raises",
          "Rear Delt Fly",
          "Biceps Curls",
          "Triceps Pushdowns"
        ])
      },
      {
        day: "Day 3",
        focus: "Legs",
        exercises: createExercises([
          "Squats",
          "Leg Press",
          "Hamstring Curls",
          "Calf Raises",
          "Core Work"
        ])
      }
    ]
  },
  {
    name: "Bro Split",
    frequency: "5 days/week",
    days: [
      {
        day: "Monday",
        focus: "Chest",
        exercises: createExercises([
          "Bench Press",
          "Incline Dumbbell Press",
          "Chest Fly",
          "Push-ups"
        ])
      },
      {
        day: "Tuesday",
        focus: "Back",
        exercises: createExercises([
          "Deadlift",
          "Lat Pulldown",
          "Barbell Row",
          "Seated Cable Row"
        ])
      },
      {
        day: "Wednesday",
        focus: "Shoulders",
        exercises: createExercises([
          "Shoulder Press",
          "Lateral Raises",
          "Front Raises",
          "Face Pulls"
        ])
      },
      {
        day: "Thursday",
        focus: "Arms",
        exercises: createExercises([
          "Biceps Curls",
          "Hammer Curls",
          "Triceps Dips",
          "Skull Crushers"
        ])
      },
      {
        day: "Friday",
        focus: "Legs",
        exercises: createExercises([
          "Squat",
          "Leg Press",
          "Romanian Deadlift",
          "Leg Curls",
          "Calf Raises"
        ])
      }
    ]
  },
  {
    name: "5-Day Bodypart Split",
    frequency: "5 days/week",
    days: [
      {
        day: "Day 1",
        focus: "Chest",
        exercises: createExercises([
          "Bench Press",
          "Incline Press",
          "Chest Dips",
          "Chest Fly"
        ])
      },
      {
        day: "Day 2",
        focus: "Back",
        exercises: createExercises([
          "Deadlift",
          "Pull-ups",
          "Lat Pulldown",
          "Barbell Row"
        ])
      },
      {
        day: "Day 3",
        focus: "Legs",
        exercises: createExercises([
          "Squats",
          "Leg Press",
          "Hamstring Curls",
          "Calf Raises"
        ])
      },
      {
        day: "Day 4",
        focus: "Shoulders",
        exercises: createExercises([
          "Shoulder Press",
          "Lateral Raises",
          "Rear Delt Fly",
          "Shrugs"
        ])
      },
      {
        day: "Day 5",
        focus: "Arms",
        exercises: createExercises([
          "Biceps Curls",
          "Cable Curls",
          "Triceps Extensions",
          "Dips"
        ])
      }
    ]
  },
  {
    name: "6-Day Specialist Split",
    frequency: "6 days/week",
    days: [
      {
        day: "Day 1",
        focus: "Chest",
        exercises: createExercises([
          "Bench Press",
          "Incline Press",
          "Chest Fly",
          "Push-ups"
        ])
      },
      {
        day: "Day 2",
        focus: "Back",
        exercises: createExercises([
          "Deadlift",
          "Pull-ups",
          "Barbell Row",
          "Cable Row"
        ])
      },
      {
        day: "Day 3",
        focus: "Shoulders",
        exercises: createExercises([
          "Shoulder Press",
          "Lateral Raises",
          "Rear Delt Fly",
          "Shrugs"
        ])
      },
      {
        day: "Day 4",
        focus: "Arms",
        exercises: createExercises([
          "Biceps Curls",
          "Hammer Curls",
          "Triceps Rope Pushdowns",
          "Dips"
        ])
      },
      {
        day: "Day 5",
        focus: "Legs (Quads Focus)",
        exercises: createExercises([
          "Squat",
          "Leg Extensions",
          "Leg Press",
          "Calf Raises"
        ])
      },
      {
        day: "Day 6",
        focus: "Legs (Glutes & Hamstrings)",
        exercises: createExercises([
          "Romanian Deadlift",
          "Hip Thrust",
          "Hamstring Curls",
          "Glute Bridges"
        ])
      }
    ]
  }
];
