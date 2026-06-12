import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { WorkoutScale } from "@/lib/format";
import type { WeightUnit } from "@/lib/weight-unit";
import type { RxGender } from "@/lib/programming/rx-variants-schema";

export type ProfileFormValues = {
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  avatarUrl: string;
  rxGender: RxGender | null;
  defaultWorkoutScale: WorkoutScale | "";
  weightUnit: WeightUnit;
  timezone: string;
};

export function useProfile() {
  const { user, contactId, refresh, setRxGender } = useAuth();

  const save = useCallback(
    async (values: ProfileFormValues): Promise<{ error: string | null }> => {
      if (!user || !contactId) return { error: "Not signed in" };

      const { error: contactErr } = await supabase
        .from("contact")
        .update({
          first_name: values.firstName.trim() || null,
          last_name: values.lastName.trim() || null,
          phone: values.phone.trim() || null,
          email: values.email.trim() || null,
          avatar_url: values.avatarUrl.trim() || null,
          rx_gender: values.rxGender,
          default_workout_scale: values.defaultWorkoutScale || null,
          weight_unit: values.weightUnit,
          timezone: values.timezone.trim() || null,
        })
        .eq("id", contactId);

      if (contactErr) return { error: contactErr.message };

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ display_name: values.displayName.trim() || null })
        .eq("id", user.id);

      if (profileErr) return { error: profileErr.message };

      setRxGender(values.rxGender);
      await refresh();
      return { error: null };
    },
    [user, contactId, refresh, setRxGender],
  );

  return { save };
}
