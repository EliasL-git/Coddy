import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import type { GraderFeedback } from "../types";

interface BitsyGraderProps {
  feedback: GraderFeedback | null;
  isChecking: boolean;
}

export default function BitsyGrader({ feedback, isChecking }: BitsyGraderProps) {
  if (!feedback && !isChecking) return null;

  const isValid = feedback?.valid;
  const status = isChecking ? "checking" : isValid ? "success" : "error";

  const statusStyles = {
    checking: "border-primary/30 bg-primary/5 text-primary",
    success: "border-secondary/30 bg-secondary/5 text-secondary",
    error: "border-error/30 bg-error/5 text-error",
  };

  const icons = {
    checking: <Loader2 size={20} className="animate-spin" />,
    success: <CheckCircle size={20} />,
    error: <AlertTriangle size={20} />,
  };

  const messages = {
    checking: "Checking your solution...",
    success: "Perfect! Your code passed all checks.",
    error: feedback?.fix || "Almost there. Check the hints above.",
  };

  return (
    <div className={`rounded-lg border ${statusStyles[status]} p-3 flex items-start gap-3`}>
      <div className="shrink-0 mt-0.5">{icons[status]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{messages[status]}</p>
        {status === "error" && feedback?.aiPowered && (
          <p className="text-xs mt-1 opacity-75">AI-powered feedback</p>
        )}
      </div>
    </div>
  );
}