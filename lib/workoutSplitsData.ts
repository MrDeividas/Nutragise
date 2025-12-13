export interface WorkoutSplitDay {
  day: string;
  focus: string;
  exercises: string[];
}

export interface PremadeWorkoutSplit {
  name: string;
  frequency: string;
  days: WorkoutSplitDay[];
}

export const PREMADE_WORKOUT_SPLITS: PremadeWorkoutSplit[] = [
  {
    name: "Full Body",
    frequency: "3 days/week",
    days: [
      {
        day: "Day 1",
        focus: "Full Body",
        exercises: [
          "Squat",
          "Bench Press",
          "Deadlift",
          "Pull-ups",
          "Shoulder Press",
          "Core Work"
        ]
      },
      {
        day: "Day 2",
        focus: "Full Body",
        exercises: [
          "Leg Press",
          "Incline Dumbbell Press",
          "Barbell Row",
          "Lateral Raises",
          "Hamstring Curls",
          "Core Work"
        ]
      },
      {
        day: "Day 3",
        focus: "Full Body",
        exercises: [
          "Lunges",
          "Chest Fly",
          "Lat Pulldown",
          "Dumbbell Shoulder Press",
          "Triceps Extensions",
          "Biceps Curls"
        ]
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
        exercises: [
          "Bench Press",
          "Barbell Row",
          "Overhead Press",
          "Pull-ups",
          "Biceps Curls",
          "Triceps Pushdowns"
        ]
      },
      {
        day: "Day 2",
        focus: "Lower Body",
        exercises: [
          "Squat",
          "Romanian Deadlift",
          "Leg Press",
          "Calf Raises",
          "Hamstring Curls",
          "Core Work"
        ]
      },
      {
        day: "Day 3",
        focus: "Upper Body",
        exercises: [
          "Incline Press",
          "Lat Pulldown",
          "Dumbbell Shoulder Press",
          "Cable Row",
          "Lateral Raises",
          "Face Pulls"
        ]
      },
      {
        day: "Day 4",
        focus: "Lower Body",
        exercises: [
          "Deadlift",
          "Front Squat",
          "Leg Extensions",
          "Glute Bridges",
          "Calf Raises",
          "Core Work"
        ]
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
        exercises: [
          "Bench Press",
          "Incline Dumbbell Press",
          "Shoulder Press",
          "Lateral Raises",
          "Triceps Dips",
          "Triceps Rope Pushdowns"
        ]
      },
      {
        day: "Day 2",
        focus: "Pull",
        exercises: [
          "Deadlift",
          "Pull-ups",
          "Barbell Row",
          "Lat Pulldown",
          "Rear Delt Fly",
          "Biceps Curls"
        ]
      },
      {
        day: "Day 3",
        focus: "Legs",
        exercises: [
          "Squat",
          "Leg Press",
          "Romanian Deadlift",
          "Hamstring Curls",
          "Calf Raises",
          "Core Work"
        ]
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
        exercises: [
          "Bench Press",
          "Chest Fly",
          "Pull-ups",
          "Barbell Row",
          "Lat Pulldown"
        ]
      },
      {
        day: "Day 2",
        focus: "Shoulders & Arms",
        exercises: [
          "Shoulder Press",
          "Lateral Raises",
          "Rear Delt Fly",
          "Biceps Curls",
          "Triceps Pushdowns"
        ]
      },
      {
        day: "Day 3",
        focus: "Legs",
        exercises: [
          "Squats",
          "Leg Press",
          "Hamstring Curls",
          "Calf Raises",
          "Core Work"
        ]
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
        exercises: [
          "Bench Press",
          "Incline Dumbbell Press",
          "Chest Fly",
          "Push-ups"
        ]
      },
      {
        day: "Tuesday",
        focus: "Back",
        exercises: [
          "Deadlift",
          "Lat Pulldown",
          "Barbell Row",
          "Seated Cable Row"
        ]
      },
      {
        day: "Wednesday",
        focus: "Shoulders",
        exercises: [
          "Shoulder Press",
          "Lateral Raises",
          "Front Raises",
          "Face Pulls"
        ]
      },
      {
        day: "Thursday",
        focus: "Arms",
        exercises: [
          "Biceps Curls",
          "Hammer Curls",
          "Triceps Dips",
          "Skull Crushers"
        ]
      },
      {
        day: "Friday",
        focus: "Legs",
        exercises: [
          "Squat",
          "Leg Press",
          "Romanian Deadlift",
          "Leg Curls",
          "Calf Raises"
        ]
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
        exercises: [
          "Bench Press",
          "Incline Press",
          "Chest Dips",
          "Chest Fly"
        ]
      },
      {
        day: "Day 2",
        focus: "Back",
        exercises: [
          "Deadlift",
          "Pull-ups",
          "Lat Pulldown",
          "Barbell Row"
        ]
      },
      {
        day: "Day 3",
        focus: "Legs",
        exercises: [
          "Squats",
          "Leg Press",
          "Hamstring Curls",
          "Calf Raises"
        ]
      },
      {
        day: "Day 4",
        focus: "Shoulders",
        exercises: [
          "Shoulder Press",
          "Lateral Raises",
          "Rear Delt Fly",
          "Shrugs"
        ]
      },
      {
        day: "Day 5",
        focus: "Arms",
        exercises: [
          "Biceps Curls",
          "Cable Curls",
          "Triceps Extensions",
          "Dips"
        ]
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
        exercises: [
          "Bench Press",
          "Incline Press",
          "Chest Fly",
          "Push-ups"
        ]
      },
      {
        day: "Day 2",
        focus: "Back",
        exercises: [
          "Deadlift",
          "Pull-ups",
          "Barbell Row",
          "Cable Row"
        ]
      },
      {
        day: "Day 3",
        focus: "Shoulders",
        exercises: [
          "Shoulder Press",
          "Lateral Raises",
          "Rear Delt Fly",
          "Shrugs"
        ]
      },
      {
        day: "Day 4",
        focus: "Arms",
        exercises: [
          "Biceps Curls",
          "Hammer Curls",
          "Triceps Rope Pushdowns",
          "Dips"
        ]
      },
      {
        day: "Day 5",
        focus: "Legs (Quads Focus)",
        exercises: [
          "Squat",
          "Leg Extensions",
          "Leg Press",
          "Calf Raises"
        ]
      },
      {
        day: "Day 6",
        focus: "Legs (Glutes & Hamstrings)",
        exercises: [
          "Romanian Deadlift",
          "Hip Thrust",
          "Hamstring Curls",
          "Glute Bridges"
        ]
      }
    ]
  }
];
