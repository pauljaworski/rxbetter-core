import { useCallback, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  createAthleteCustomWorkout,
  deleteAthleteCustomWorkout,
  fetchAthleteCustomWorkouts,
  type AthleteCustomWorkout,
} from "@/lib/programming/athlete-custom-workouts";
import { useAsyncState } from "./useAsyncState";

export function useAthleteCustomWorkouts(date: Date) {
  const { contactId, activeGymId } = useAuth();
  const dateKey = format(date, "yyyy-MM-dd");

  const loader = useCallback(async (): Promise<AthleteCustomWorkout[]> => {
    if (!contactId) return [];
    return fetchAthleteCustomWorkouts(contactId, dateKey, dateKey);
  }, [contactId, dateKey]);

  return useAsyncState(loader, [loader], [] as AthleteCustomWorkout[], (d) => d.length === 0);
}

export function useCreateAthleteCustomWorkout() {
  const { contactId, activeGymId } = useAuth();
  const [busy, setBusy] = useState(false);

  async function create(input: {
    wodDate: string;
    name: string;
    segment: string;
    notes?: string;
    movements: string[];
  }) {
    if (!contactId) return { error: "Sign in to create workouts" };
    setBusy(true);
    const result = await createAthleteCustomWorkout({
      contactId,
      gymId: activeGymId,
      ...input,
    });
    setBusy(false);
    return result;
  }

  async function remove(programmingId: string) {
    if (!contactId) return { error: "Sign in required" };
    setBusy(true);
    const result = await deleteAthleteCustomWorkout(programmingId, contactId);
    setBusy(false);
    return result;
  }

  return { create, remove, busy };
}
