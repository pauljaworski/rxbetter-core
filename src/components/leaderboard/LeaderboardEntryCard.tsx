import { useState } from "react";
import { Heart, MessageCircle, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/hooks/useLeaderboard";
import { toggleLeaderboardLike } from "@/hooks/useLeaderboard";
import { LeaderboardComments } from "./LeaderboardComments";
import { toast } from "sonner";

type Props = {
  entry: LeaderboardEntry;
  gymId: string;
  contactId: string | null;
  showScale?: boolean;
  onSocialChange: () => void;
};

function rankStyle(rank: number): string {
  if (rank === 1) return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
  if (rank === 2) return "bg-slate-400/20 text-slate-600 dark:text-slate-300";
  if (rank === 3) return "bg-orange-700/20 text-orange-700 dark:text-orange-400";
  return "bg-muted text-muted-foreground";
}

export function LeaderboardEntryCard({
  entry,
  gymId,
  contactId,
  showScale,
  onSocialChange,
}: Props) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  async function handleLike() {
    if (!contactId) {
      toast.error("Sign in to like scores");
      return;
    }
    const { error } = await toggleLeaderboardLike(
      gymId,
      entry.performanceId,
      contactId,
      entry.likedByMe,
    );
    if (error) {
      toast.error("Couldn't update like", { description: error });
      return;
    }
    onSocialChange();
  }

  const initials = entry.athlete.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/60 bg-card/80 p-4 transition-colors",
        entry.rank <= 3 && "border-primary/30 bg-primary/[0.03]",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black",
            rankStyle(entry.rank),
          )}
        >
          {entry.rank <= 3 ? <Medal className="h-4 w-4" /> : entry.rank}
        </div>
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={entry.athlete.avatarUrl ?? undefined} alt={entry.athlete.displayName} />
          <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{entry.athlete.displayName}</p>
          {showScale && entry.scaleLabel && (
            <Badge variant="secondary" className="mt-0.5 text-[10px]">
              {entry.scaleLabel}
            </Badge>
          )}
        </div>
        <div className="text-right">
          <p className="font-mono-num text-2xl font-black tracking-tight text-primary">{entry.score}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-border/50 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-8 gap-1.5 text-xs", entry.likedByMe && "text-rose-500")}
          disabled={!contactId}
          onClick={() => void handleLike()}
        >
          <Heart className={cn("h-3.5 w-3.5", entry.likedByMe && "fill-current")} />
          {entry.likeCount || "Like"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setCommentsOpen((o) => !o)}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {entry.commentCount || "Comment"}
        </Button>
      </div>

      {commentsOpen && (
        <LeaderboardComments
          performanceId={entry.performanceId}
          gymId={gymId}
          contactId={contactId}
          liked={entry.likedByMe}
          onLikeToggle={onSocialChange}
          onCommentPosted={onSocialChange}
        />
      )}
    </div>
  );
}
