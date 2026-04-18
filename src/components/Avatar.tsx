import { cn } from "@/lib/utils";

type Props = {
  initials: string;
  color: string; // HSL triplet without hsl()
  size?: "sm" | "md" | "lg";
  className?: string;
  imageUrl?: string | null;
};

export const PersonAvatar = ({ initials, color, size = "md", className, imageUrl }: Props) => {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-lg",
  };
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full font-semibold text-primary-foreground shadow-card ring-2 ring-background",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: imageUrl ? undefined : `hsl(${color})` }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};
