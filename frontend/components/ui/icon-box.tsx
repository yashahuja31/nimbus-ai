import { LucideIcon } from "lucide-react";
import clsx from "clsx";

const TONES: Record<string, string> = {
  pulse: "bg-pulse/10 text-pulse border-pulse/20",
  mint: "bg-mint/10 text-mint border-mint/20",
  amber: "bg-amber/10 text-amber border-amber/20",
  coral: "bg-coral/10 text-coral border-coral/20",
  dim: "bg-dim/10 text-dim border-dim/20",
};

export function IconBox({
  icon: Icon,
  tone = "pulse",
  size = "md",
}: {
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" }[size];
  const iconSize = { sm: 14, md: 18, lg: 24 }[size];
  return (
    <div className={clsx("inline-flex items-center justify-center rounded-lg border shrink-0", dims, TONES[tone])}>
      <Icon size={iconSize} strokeWidth={2} />
    </div>
  );
}
