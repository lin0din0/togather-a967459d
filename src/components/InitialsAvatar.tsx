import { cn } from "@/lib/utils";

/** Initials avatar with a soft coral gradient. */
export const InitialsAvatar = ({
  initials,
  size = 40,
  className,
  variant = "coral",
  bordered = true,
}: {
  initials: string;
  size?: number;
  className?: string;
  variant?: "coral" | "violet" | "teal" | "neutral";
  bordered?: boolean;
}) => {
  const gradients: Record<string, string> = {
    coral: "linear-gradient(135deg, hsl(var(--primary-soft)), hsl(11 100% 68%))",
    violet: "linear-gradient(135deg, hsl(var(--ai-soft)), hsl(252 80% 72%))",
    teal: "linear-gradient(135deg, hsl(var(--success-soft)), hsl(169 65% 55%))",
    neutral: "linear-gradient(135deg, hsl(0 0% 92%), hsl(0 0% 80%))",
  };
  return (
    <div
      style={{ width: size, height: size, background: gradients[variant], fontSize: Math.round(size * 0.36) }}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white",
        bordered && "border-[1.5px] border-foreground",
        className,
      )}
    >
      {initials}
    </div>
  );
};
