import clsx from "clsx";

const RISK_STYLES: Record<string, string> = {
  low: "bg-mint/10 text-mint border-mint/30",
  medium: "bg-amber/10 text-amber border-amber/30",
  high: "bg-coral/10 text-coral border-coral/30",
};

const STATUS_STYLES: Record<string, string> = {
  proposed: "bg-dim/10 text-dim border-dim/30",
  approved: "bg-pulse/10 text-pulse border-pulse/30",
  executing: "bg-amber/10 text-amber border-amber/30",
  completed: "bg-mint/10 text-mint border-mint/30",
  failed: "bg-coral/10 text-coral border-coral/30",
  rejected: "bg-dim/10 text-dim border-dim/30",
};

export function Badge({ kind, value }: { kind: "risk" | "status"; value: string }) {
  const styles = kind === "risk" ? RISK_STYLES : STATUS_STYLES;
  return (
    <span
      className={clsx(
        "inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        styles[value] || "bg-dim/10 text-dim border-dim/30"
      )}
    >
      {value}
    </span>
  );
}
