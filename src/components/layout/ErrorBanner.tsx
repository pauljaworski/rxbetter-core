import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatSupabaseError } from "@/lib/format";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{formatSupabaseError(message)}</AlertDescription>
    </Alert>
  );
}
