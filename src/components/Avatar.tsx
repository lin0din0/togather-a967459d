import { cn } from "@/lib/utils";

type Props = {
  initials: string;
  color: string; // HSL triplet without hsl()
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const PersonAvatar = ({ initials, color, size = "md", className }: Props) => {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-lg",
  };
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-primary-foreground shadow-card ring-2 ring-background",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: `hsl(${color})` }}
    >
      {initials}
    </div>
  );
};
