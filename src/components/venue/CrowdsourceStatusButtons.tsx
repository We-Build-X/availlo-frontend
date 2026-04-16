import { useEffect, useState } from "react";
import { CheckCircle, CloseCircle } from "@solar-icons/react";
import { Button } from "@/components/ui/button";

type CrowdsourceStatusButtonsProps = {
  venueId?: string | number;
};

const INITIAL_YES_VOTES = 17;
const INITIAL_NO_VOTES = 3;

export function CrowdsourceStatusButtons({
  venueId,
}: CrowdsourceStatusButtonsProps) {
  const [yesVotes, setYesVotes] = useState(INITIAL_YES_VOTES);
  const [noVotes, setNoVotes] = useState(INITIAL_NO_VOTES);
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    setYesVotes(INITIAL_YES_VOTES);
    setNoVotes(INITIAL_NO_VOTES);
    setVoted(null);
  }, [venueId]);

  const handleVote = (type: "yes" | "no") => {
    if (voted) return;
    if (type === "yes") {
      setYesVotes((prev) => prev + 1);
    } else {
      setNoVotes((prev) => prev + 1);
    }
    setVoted(type);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold uppercase tracking-wider text-slate-900 mb-1">
          Help Fellow Students
        </h3>
        <p className="text-base text-slate-500 font-medium leading-relaxed">
          Is this room currently occupied? Your report helps everyone stay
          updated.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => handleVote("yes")}
          disabled={!!voted}
          className={`h-auto flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${
            voted === "yes"
              ? "bg-red-100 border-red-200 shadow-inner"
              : "bg-white border-slate-200 hover:border-red-200 hover:shadow-md"
          }`}
        >
          <CheckCircle
            className={`size-6.5 ${voted === "yes" ? "text-red-500" : "text-slate-400"}`}
            weight={voted === "yes" ? "Bold" : "Linear"}
          />
          <span
            className={`mt-2 text-sm font-bold uppercase tracking-wide ${voted === "yes" ? "text-red-700" : "text-slate-600"}`}
          >
            Yes, Class is on ({yesVotes})
          </span>
        </Button>
        <Button
          variant="outline"
          onClick={() => handleVote("no")}
          disabled={!!voted}
          className={`h-auto flex flex-col items-center justify-center p-6  rounded-xl border-2 transition-all duration-300 ${
            voted === "no"
              ? "bg-blue-100 border-blue-200 shadow-inner"
              : "bg-white border-slate-200 hover:border-blue-200 !hover:bg-blue-500/10 hover:shadow-md"
          }`}
        >
          <CloseCircle
            className={`size-6.5 ${voted === "no" ? "text-blue-500" : "text-slate-400"}`}
            weight={voted === "no" ? "Bold" : "Linear"}
          />
          <span
            className={`mt-2 text-sm font-bold uppercase tracking-wide ${voted === "no" ? "text-blue-700" : "text-slate-600"}`}
          >
            No, It's Free ({noVotes})
          </span>
        </Button>
      </div>
      {voted && (
        <p className="text-[10px] font-bold uppercase text-center text-slate-400 animate-in fade-in slide-in-from-bottom-1">
          Thanks for your report!
        </p>
      )}
    </div>
  );
}
