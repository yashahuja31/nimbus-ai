import clsx from "clsx";

const RISK_STYLES: Record<string, string> = {
  low: "bg-signal/10 text-signal border-signal/30",
  medium: "bg-risk/10 text-risk border-risk/30",
  high: "bg-danger/10 text-danger border-danger/30",
};

const STATUS_STYLES: Record<string, string> = {
  proposed: "bg-dim/10 text-dim border-dim/30",
  approved: "bg-signal/10 text-signal border-signal/30",
  executing: "bg-risk/10 text-risk border-risk/30",
  completed: "bg-signal/10 text-signal border-signal/30",
  failed: "bg-danger/10 text-danger border-danger/30",
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
