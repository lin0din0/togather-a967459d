import { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export const SectionHeader = ({ eyebrow, title, subtitle, action }: Props) => (
  <div className="mb-4 flex items-end justify-between gap-3">
    <div>
      {eyebrow && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      )}
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {action}
  </div>
);
