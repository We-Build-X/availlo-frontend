import { useState } from "react";
import { LightbulbBolt } from "@solar-icons/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "../ui/card";

interface UtilityStatusProps {
  hasPower: boolean;
}

export function UtilityStatus({
  hasPower: initialHasPower,
}: UtilityStatusProps) {
  const [hasPower, setHasPower] = useState(initialHasPower);
  const [reportsCount, setReportsCount] = useState(12);

  const handleToggle = (checked: boolean) => {
    setHasPower(checked);
    // Mocking an update: if a user toggles, we increment the "reports"
    setReportsCount((prev) => prev + 1);
  };

  return (
    <Card className="flex items-center justify-between rounded-2xl flex-row border border-neutral-400 transition-all hover:shadow-[2px_2px_0px_0px_#ddd]">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl border border-border ${hasPower ? "bg-amber-100" : "bg-slate-100"}`}
        >
          <LightbulbBolt
            size={24}
            className={hasPower ? "text-amber-500" : "text-slate-400"}
            weight={hasPower ? "Bold" : "Linear"}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              Electricity {hasPower ? "On" : "Off"}
            </p>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
              {reportsCount} reports
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {hasPower
              ? "Currently reported as available"
              : "Reported as unavailable"}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="electricity-status"
          checked={hasPower}
          variant="ios"
          onCheckedChange={handleToggle}
        />
        <Label htmlFor="electricity-status" className="sr-only">
          Toggle Electricity Status
        </Label>
      </div>
    </Card>
  );
}
