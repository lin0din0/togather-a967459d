/**
 * Togather logo mark — two overlapping coral/violet circles.
 */
type Props = { size?: number; className?: string };
export const Logo = ({ size = 36, className }: Props) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-hidden>
    <circle cx="13" cy="18" r="10" fill="hsl(var(--primary))" opacity="0.82" />
    <circle cx="23" cy="18" r="10" fill="hsl(var(--ai))" opacity="0.82" />
    <ellipse cx="18" cy="18" rx="3" ry="7" fill="hsl(var(--primary))" opacity="0.2" />
  </svg>
);
