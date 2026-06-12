import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  loadLeaderboardComments,
  postLeaderboardComment,
  toggleLeaderboardLike,
} from "@/hooks/useLeaderboard";

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  contact_id: string;
};

type Props = {
  performanceId: string;
  gymId: string;
  contactId: string | null;
  liked: boolean;
  onLikeToggle: () => void;
  onCommentPosted: () => void;
};

export function LeaderboardComments({
  performanceId,
  gymId,
  contactId,
  liked,
  onLikeToggle,
  onCommentPosted,
}: Props) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadLeaderboardComments(performanceId)
      .then((rows) => {
        if (!cancelled) setComments(rows as CommentRow[]);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [performanceId]);

  async function submitComment() {
    if (!contactId || !draft.trim()) return;
    setPosting(true);
    const { error } = await postLeaderboardComment(gymId, performanceId, contactId, draft);
    setPosting(false);
    if (error) {
      toast.error("Couldn't post comment", { description: error });
      return;
    }
    setDraft("");
    const rows = await loadLeaderboardComments(performanceId);
    setComments(rows as CommentRow[]);
    onCommentPosted();
  }

  async function toggleLike() {
    if (!contactId) {
      toast.error("Sign in to like scores");
      return;
    }
    const { error } = await toggleLeaderboardLike(gymId, performanceId, contactId, liked);
    if (error) {
      toast.error("Couldn't update like", { description: error });
      return;
    }
    onLikeToggle();
  }

  return (
    <div className="space-y-3 rounded-lg bg-muted/40 p-3">
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {loading && <p className="text-xs text-muted-foreground">Loading comments…</p>}
        {!loading && comments.length === 0 && (
          <p className="text-xs text-muted-foreground">Be the first to comment.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="text-sm">
            <p className="leading-snug">{c.body}</p>
            <p className="text-[10px] text-muted-foreground">
              {format(new Date(c.created_at), "MMM d · h:mm a")}
            </p>
          </div>
        ))}
      </div>
      {contactId && (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            className="h-9 text-sm"
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitComment();
            }}
          />
          <Button type="button" size="sm" disabled={posting || !draft.trim()} onClick={() => void submitComment()}>
            Post
          </Button>
        </div>
      )}
      <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => void toggleLike()}>
        {liked ? "Unlike" : "Like this score"}
      </Button>
    </div>
  );
}
