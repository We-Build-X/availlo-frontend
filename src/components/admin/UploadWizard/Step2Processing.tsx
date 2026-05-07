import { useState, useEffect } from "react";
import { CheckCircle } from "@solar-icons/react";

interface Step2ProcessingProps {
  onNext: () => void;
}

export function Step2Processing({ onNext }: Step2ProcessingProps) {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{ msg: string; done: boolean }[]>([
    { msg: "Scanning pages...", done: false },
    { msg: "Detecting entries...", done: false },
    { msg: "Mapping venues...", done: false },
  ]);

  useEffect(() => {
    let currentProgress = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        timeout = setTimeout(onNext, 600); // Wait a bit then move
      }
      setProgress(currentProgress);

      setLogs((prev) => {
        const next = [...prev];
        if (currentProgress > 25) next[0].done = true;
        if (currentProgress > 60) next[1].done = true;
        if (currentProgress > 90) next[2].done = true;
        return next;
      });
    }, 300);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onNext]);

  return (
    <div className="space-y-8 py-8">
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-primary">
          <span>Processing Data</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`flex justify-between items-center text-sm font-medium ${progress > (i * 30) ? "text-slate-800" : "text-slate-300"}`}
          >
            <div className="flex items-center gap-3">
              {log.done ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : progress > i * 30 ? (
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
              )}
              {log.msg}
            </div>
            {log.done && (
              <span className="text-xs font-bold text-green-500 uppercase tracking-wider">
                Done
              </span>
            )}
            {!log.done && progress > i * 30 && (
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                In Progress
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
