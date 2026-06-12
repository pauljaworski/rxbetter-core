import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WORKOUT_SCALE_OPTIONS } from "@/lib/format";
import { toast } from "sonner";
import type { RxGender } from "@/lib/programming/rx-variants-schema";
import type { WeightUnit } from "@/lib/weight-unit";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Australia/Sydney",
];

export default function Profile() {
  const auth = useAuth();
  const { save } = useProfile();
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [rxGender, setRxGenderLocal] = useState<RxGender | "unset">("unset");
  const [defaultScale, setDefaultScale] = useState<string>("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb");
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    setDisplayName(auth.profileDisplayName ?? auth.displayName ?? "");
    setFirstName(auth.firstName ?? "");
    setLastName(auth.lastName ?? "");
    setEmail(auth.email ?? "");
    setPhone(auth.phone ?? "");
    setAvatarUrl(auth.avatarUrl ?? "");
    setRxGenderLocal(auth.rxGender ?? "unset");
    setDefaultScale(auth.defaultWorkoutScale ?? "");
    setWeightUnit(auth.weightUnit);
    setTimezone(auth.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
  }, [
    auth.profileDisplayName,
    auth.displayName,
    auth.firstName,
    auth.lastName,
    auth.email,
    auth.phone,
    auth.avatarUrl,
    auth.rxGender,
    auth.defaultWorkoutScale,
    auth.weightUnit,
    auth.timezone,
  ]);

  const initials =
    (displayName || firstName || "A")
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await save({
      displayName,
      firstName,
      lastName,
      email,
      phone,
      avatarUrl,
      rxGender: rxGender === "unset" ? null : rxGender,
      defaultWorkoutScale:
        defaultScale === "rx_plus" ||
        defaultScale === "rx" ||
        defaultScale === "fx" ||
        defaultScale === "scaled"
          ? defaultScale
          : "",
      weightUnit,
      timezone,
    });
    setSaving(false);
    if (error) {
      toast.error("Couldn't save profile", { description: error });
      return;
    }
    toast.success("Profile saved");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="eyebrow">Account</p>
        <h1 className="text-3xl font-black tracking-tight">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Display name, Rx preferences, and units apply across programming, PRs, and the leaderboard.
        </p>
      </header>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
        <Card className="glass-card p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="avatarUrl">Photo URL</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
        </Card>

        <Card className="glass-card space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you appear on the leaderboard"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
            />
          </div>
        </Card>

        <Card className="glass-card space-y-4 p-5">
          <p className="text-sm font-semibold">Training preferences</p>
          <div className="space-y-2">
            <Label>Gender (Rx display)</Label>
            <Select
              value={rxGender}
              onValueChange={(v) => setRxGenderLocal(v as RxGender | "unset")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Show both (M/F notation)</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Default logging scale</Label>
            <Select value={defaultScale || "unset"} onValueChange={(v) => setDefaultScale(v === "unset" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose default…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">No default (use prescribed)</SelectItem>
                {WORKOUT_SCALE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Weight unit</Label>
            <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as WeightUnit)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lb">Pounds (lb)</SelectItem>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone…" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
