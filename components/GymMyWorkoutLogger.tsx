import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExerciseSetsReps } from '../lib/workoutSplitsData';
import { workoutExerciseLogService } from '../lib/workoutExerciseLogService';
import { workoutSplitService } from '../lib/workoutSplitService';
import { WorkoutSplitDay } from '../types/database';
import { supabase } from '../lib/supabase';

type QuickEntry = {
  id: string;
  sets: string;
  reps: string;
  weight: string;
};

export type GymMyWorkoutLoggerHandle = {
  save: () => Promise<void>;
};

type Props = {
  userId: string;
  splitId: string;
  dayIndex: number;
  day: WorkoutSplitDay;
  onGoToWorkoutSection?: () => void;
  /** Show weight inputs for full workout customisation */
  showWeight?: boolean;
  /** Render without outer card chrome (parent already has a card) */
  embedded?: boolean;
  onRemoveExercise?: (exerciseName: string) => void;
  footer?: React.ReactNode;
};

function exerciseNameOf(exercise: string | { name?: string }): string {
  return typeof exercise === 'string' ? exercise : exercise?.name || String(exercise);
}

function formatKg(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const GymMyWorkoutLogger = forwardRef<GymMyWorkoutLoggerHandle, Props>(
  function GymMyWorkoutLogger(
    {
      userId,
      splitId,
      dayIndex,
      day,
      onGoToWorkoutSection,
      showWeight = false,
      embedded = false,
      onRemoveExercise,
      footer,
    },
    ref
  ) {
    const [loading, setLoading] = useState(true);
    const [completionId, setCompletionId] = useState<string | null>(null);
    const [entries, setEntries] = useState<Record<string, QuickEntry[]>>({});
    const [previousByExercise, setPreviousByExercise] = useState<
      Record<string, { sets?: number | null; reps?: number | null; weight?: number | null }>
    >({});

    useEffect(() => {
      let cancelled = false;

      (async () => {
        setLoading(true);
        try {
          const today = new Date().toISOString().split('T')[0];
          const { data: existingCompletion } = await supabase
            .from('workout_completions')
            .select('*')
            .eq('user_id', userId)
            .eq('split_id', splitId)
            .eq('day_index', dayIndex)
            .eq('completed_date', today)
            .maybeSingle();

          const logsByExercise: Record<string, any[]> = {};
          if (existingCompletion) {
            if (!cancelled) setCompletionId(existingCompletion.id);
            const logs = await workoutExerciseLogService.getExerciseLogsForCompletion(
              existingCompletion.id
            );
            logs.forEach((log) => {
              if (!logsByExercise[log.exercise_name]) logsByExercise[log.exercise_name] = [];
              logsByExercise[log.exercise_name].push(log);
            });
          } else if (!cancelled) {
            setCompletionId(null);
          }

          const map: Record<string, QuickEntry[]> = {};
          const prevMap: Record<
            string,
            { sets?: number | null; reps?: number | null; weight?: number | null }
          > = {};

          for (const exercise of day.exercises || []) {
            const exerciseName = exerciseNameOf(exercise as any);
            const recommended =
              typeof exercise === 'object' && (exercise as any).sets
                ? { sets: (exercise as any).sets, reps: String((exercise as any).reps || '') }
                : getExerciseSetsReps(exerciseName);
            const existingLogs = logsByExercise[exerciseName] || [];
            const previous = await workoutExerciseLogService.getPreviousExerciseData(
              userId,
              exerciseName
            );
            const highest = await workoutExerciseLogService.getHighestWeightAndReps(
              userId,
              exerciseName
            );

            prevMap[exerciseName] = {
              sets: previous.sets ?? null,
              reps: previous.reps ?? highest.reps ?? null,
              // Prefer last logged weight; fall back to highest only for display hints
              weight: previous.weight ?? null,
            };

            if (existingLogs.length > 0) {
              const repsValues = existingLogs
                .map((l) => l.reps)
                .filter((r): r is number => r != null);
              const allSameReps =
                repsValues.length > 0 && repsValues.every((r) => r === repsValues[0]);
              const totalSets = existingLogs.reduce(
                (sum, l) => sum + (l.sets && l.sets > 0 ? l.sets : 1),
                0
              );
              const weightValues = existingLogs
                .map((l) => l.weight)
                .filter((w): w is number => w != null);
              const weightStr =
                weightValues.length > 0 ? formatKg(Math.max(...weightValues)) : '';

              if (allSameReps) {
                map[exerciseName] = [
                  {
                    id: `log_${existingLogs[0].id}`,
                    sets: String(totalSets || recommended.sets),
                    reps: String(repsValues[0]),
                    weight: weightStr,
                  },
                ];
              } else {
                map[exerciseName] = existingLogs.map((log) => ({
                  id: `log_${log.id}`,
                  sets: String(log.sets && log.sets > 0 ? log.sets : 1),
                  reps: log.reps?.toString() || '',
                  weight: log.weight != null ? formatKg(log.weight) : '',
                }));
              }
            } else {
              map[exerciseName] = [
                {
                  id: `row_${Date.now()}_${exerciseName}`,
                  sets:
                    previous.sets != null
                      ? String(previous.sets)
                      : String(recommended.sets),
                  reps: previous.reps != null ? String(previous.reps) : '',
                  // Only preset weight from the user's previous log — never invent a default
                  weight: previous.weight != null ? formatKg(previous.weight) : '',
                },
              ];
            }
          }

          if (!cancelled) {
            setEntries(map);
            setPreviousByExercise(prevMap);
          }
        } catch (e) {
          console.warn('Failed to load my-workout logger', e);
          if (!cancelled) {
            setEntries({});
            setPreviousByExercise({});
            setCompletionId(null);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [userId, splitId, dayIndex, day]);

    useImperativeHandle(ref, () => ({
      save: async () => {
        let currentCompletionId = completionId;
        if (!currentCompletionId) {
          const completion = await workoutSplitService.completeWorkout(userId, splitId, dayIndex);
          currentCompletionId = completion.id;
          setCompletionId(completion.id);
        }

        for (const exercise of day.exercises || []) {
          const exerciseName = exerciseNameOf(exercise as any);
          const rows = entries[exerciseName] || [];
          for (const row of rows) {
            const setsNum = row.sets ? parseInt(row.sets, 10) : null;
            const repsNum = row.reps ? parseInt(row.reps, 10) : null;
            const weightNum = row.weight ? parseFloat(row.weight) : null;
            if (!setsNum && !repsNum && !weightNum) continue;

            const existingLogId = row.id.startsWith('log_') ? row.id.replace('log_', '') : undefined;
            await workoutExerciseLogService.saveExerciseLog(userId, {
              completion_id: currentCompletionId,
              exercise_name: exerciseName,
              weight: weightNum != null && !Number.isNaN(weightNum) ? weightNum : null,
              sets: setsNum && !Number.isNaN(setsNum) ? setsNum : null,
              reps: repsNum && !Number.isNaN(repsNum) ? repsNum : null,
              goal_weight: null,
              logId: existingLogId,
            });
          }
        }
      },
    }));

    const updateEntry = (
      exerciseName: string,
      rowId: string,
      field: 'sets' | 'reps' | 'weight',
      value: string
    ) => {
      const cleaned =
        field === 'weight' ? value.replace(/[^0-9.]/g, '') : value.replace(/[^0-9]/g, '');
      setEntries((prev) => ({
        ...prev,
        [exerciseName]: (prev[exerciseName] || []).map((row) =>
          row.id === rowId ? { ...row, [field]: cleaned } : row
        ),
      }));
    };

    const bump = (
      exerciseName: string,
      rowId: string,
      field: 'sets' | 'reps' | 'weight',
      delta: number
    ) => {
      setEntries((prev) => ({
        ...prev,
        [exerciseName]: (prev[exerciseName] || []).map((row) => {
          if (row.id !== rowId) return row;
          const current = parseFloat(row[field] || '0') || 0;
          const next = Math.max(0, current + delta);
          return {
            ...row,
            [field]: field === 'weight' ? String(Number(next.toFixed(1))) : String(Math.round(next)),
          };
        }),
      }));
    };

    const addSetGroup = (exerciseName: string) => {
      setEntries((prev) => {
        const rows = prev[exerciseName] || [];
        const last = rows[rows.length - 1];
        return {
          ...prev,
          [exerciseName]: [
            ...rows,
            {
              id: `row_${Date.now()}_${exerciseName}`,
              sets: '1',
              reps: last?.reps || '',
              weight: last?.weight || '',
            },
          ],
        };
      });
    };

    const removeSetGroup = (exerciseName: string, rowId: string) => {
      setEntries((prev) => {
        const rows = prev[exerciseName] || [];
        if (rows.length <= 1) {
          return {
            ...prev,
            [exerciseName]: [
              { id: `row_${Date.now()}_${exerciseName}`, sets: '1', reps: '', weight: '' },
            ],
          };
        }
        return {
          ...prev,
          [exerciseName]: rows.filter((row) => row.id !== rowId),
        };
      });
    };

    const QUICK_SETS = [2, 3, 4];
    const QUICK_REPS = [6, 8, 10, 12];

    if (loading) {
      return (
        <View style={[embedded ? styles.embeddedWrap : styles.loadingCard]}>
          <ActivityIndicator color="#1f2937" />
          <Text style={styles.loadingText}>Loading exercises…</Text>
        </View>
      );
    }

    const exercises = (day.exercises || []).map((ex) => exerciseNameOf(ex as any));

    if (exercises.length === 0) {
      return (
        <View style={embedded ? styles.embeddedWrap : styles.card}>
          {!embedded ? <Text style={styles.cardLabel}>Today's exercises</Text> : null}
          <Text style={styles.hint}>No exercises in this workout day yet.</Text>
          {footer}
        </View>
      );
    }

    return (
      <View style={embedded ? styles.embeddedWrap : styles.card}>
        {!embedded ? (
          <>
            <Text style={styles.cardLabel}>Quick log</Text>
            {onGoToWorkoutSection ? (
              <TouchableOpacity
                style={styles.detailBtn}
                onPress={onGoToWorkoutSection}
                activeOpacity={0.88}
              >
                <Text style={styles.detailBtnTitle}>Go to workout for full customisation</Text>
                <Ionicons name="arrow-forward" size={16} color="#1f2937" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.hint}>{day.focus || day.day}</Text>
            )}
          </>
        ) : null}

        {exercises.map((exerciseName, exerciseIndex) => {
          const rows = entries[exerciseName] || [];
          const recommended = getExerciseSetsReps(exerciseName);
          const prev = previousByExercise[exerciseName];
          const hasPrev = prev && (prev.sets != null || prev.reps != null || prev.weight != null);
          const prevBits: string[] = [];
          if (hasPrev) {
            prevBits.push(
              `${prev?.sets != null ? prev.sets : '—'}×${prev?.reps != null ? prev.reps : '—'}`
            );
            if (prev?.weight != null) prevBits.push(`${prev.weight}kg`);
          }
          const prevLabel = hasPrev ? `Prev ${prevBits.join(' · ')}` : null;
          const suggestedLabel = `Suggested ${recommended.sets}×${recommended.reps}`;

          return (
            <View
              key={exerciseName}
              style={[styles.exerciseBlock, exerciseIndex > 0 && styles.exerciseDivider]}
            >
              <View style={styles.exerciseHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.exerciseName}>{exerciseName}</Text>
                  <Text style={styles.exerciseMeta}>
                    {prevLabel ? `${prevLabel}  ·  ${suggestedLabel}` : suggestedLabel}
                  </Text>
                </View>
                {onRemoveExercise ? (
                  <TouchableOpacity
                    onPress={() => onRemoveExercise(exerciseName)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.removeExerciseBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {rows.map((row) => (
                <View key={row.id} style={styles.entryBlock}>
                  <View style={styles.entryRow}>
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Sets</Text>
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => bump(exerciseName, row.id, 'sets', -1)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="remove" size={15} color="#1f2937" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.stepInput}
                          value={row.sets}
                          onChangeText={(v) => updateEntry(exerciseName, row.id, 'sets', v)}
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => bump(exerciseName, row.id, 'sets', 1)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="add" size={15} color="#1f2937" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.quickRow}>
                        {QUICK_SETS.map((sets) => {
                          const selected = row.sets === String(sets);
                          return (
                            <TouchableOpacity
                              key={`${row.id}-set-${sets}`}
                              style={[styles.quickChip, selected && styles.quickChipSelected]}
                              onPress={() => updateEntry(exerciseName, row.id, 'sets', String(sets))}
                              activeOpacity={0.85}
                            >
                              <Text
                                style={[
                                  styles.quickChipText,
                                  selected && styles.quickChipTextSelected,
                                ]}
                              >
                                {sets}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={[styles.field, showWeight ? styles.repsFieldCompact : styles.repsField]}>
                      <Text style={styles.fieldLabel}>Reps</Text>
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => bump(exerciseName, row.id, 'reps', -1)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="remove" size={15} color="#1f2937" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.stepInput}
                          value={row.reps}
                          onChangeText={(v) => updateEntry(exerciseName, row.id, 'reps', v)}
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => bump(exerciseName, row.id, 'reps', 1)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="add" size={15} color="#1f2937" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.quickRow}>
                        {QUICK_REPS.map((reps) => {
                          const selected = row.reps === String(reps);
                          return (
                            <TouchableOpacity
                              key={`${row.id}-rep-${reps}`}
                              style={[styles.quickChip, selected && styles.quickChipSelected]}
                              onPress={() =>
                                updateEntry(exerciseName, row.id, 'reps', String(reps))
                              }
                              activeOpacity={0.85}
                            >
                              <Text
                                style={[
                                  styles.quickChipText,
                                  selected && styles.quickChipTextSelected,
                                ]}
                              >
                                {reps}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {showWeight ? (
                      <View style={styles.weightField}>
                        <Text style={styles.fieldLabel} numberOfLines={1}>
                          Kg
                        </Text>
                        <View style={styles.stepper}>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => bump(exerciseName, row.id, 'weight', -0.5)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="remove" size={14} color="#1f2937" />
                          </TouchableOpacity>
                          <TextInput
                            style={styles.stepInput}
                            value={row.weight}
                            onChangeText={(v) => updateEntry(exerciseName, row.id, 'weight', v)}
                            keyboardType="decimal-pad"
                            placeholder="—"
                            placeholderTextColor="#9CA3AF"
                          />
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => bump(exerciseName, row.id, 'weight', 0.5)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="add" size={14} color="#1f2937" />
                          </TouchableOpacity>
                        </View>
                        {prev?.weight != null ? (
                          <View style={styles.quickRow}>
                            {[prev.weight, prev.weight + 5, prev.weight + 10].map((kg) => {
                              const label = formatKg(kg);
                              const selected = row.weight === label;
                              return (
                                <TouchableOpacity
                                  key={`${row.id}-kg-${label}`}
                                  style={[styles.quickChip, selected && styles.quickChipSelected]}
                                  onPress={() => updateEntry(exerciseName, row.id, 'weight', label)}
                                  activeOpacity={0.85}
                                >
                                  <Text
                                    style={[
                                      styles.quickChipText,
                                      selected && styles.quickChipTextSelected,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    {rows.length > 1 ? (
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => removeSetGroup(exerciseName, row.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Remove sets"
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addSetBtn}
                onPress={() => addSetGroup(exerciseName)}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={15} color="#1f2937" />
                <Text style={styles.addSetText}>Add sets</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {footer}
      </View>
    );
  }
);

export default GymMyWorkoutLogger;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  exerciseBlock: {
    paddingTop: 2,
  },
  exerciseDivider: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  exerciseMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
    marginBottom: 10,
  },
  entryBlock: {
    marginBottom: 10,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  field: {
    flex: 0.85,
  },
  repsField: {
    flex: 1.15,
  },
  repsFieldCompact: {
    flex: 1.05,
  },
  weightField: {
    flex: 0.9,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 40,
    paddingHorizontal: 1,
  },
  stepBtn: {
    width: 26,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    paddingVertical: 0,
    minWidth: 24,
  },
  deleteBtn: {
    width: 32,
    height: 40,
    marginTop: 22,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipSelected: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  quickChipTextSelected: {
    color: '#FFFFFF',
  },
  embeddedWrap: {
    width: '100%',
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  removeExerciseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  prevInline: {
    fontWeight: '500',
    color: '#9CA3AF',
  },
  addSetBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  addSetText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  detailBtn: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailBtnTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
});
