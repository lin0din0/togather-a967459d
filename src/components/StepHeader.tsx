import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
  step?: number;
  totalSteps?: number;
  stepLabel?: string;
  onBack?: () => void;
  back?: string;
  children?: ReactNode;
};

export const StepHeader = ({ step, totalSteps = 3, stepLabel, onBack, back }: Props) => {
  const nav = useNavigate();
  const handleBack = () => (onBack ? onBack() : back ? nav(back) : nav(-1));
  return (
    <div className="mb-5">
      <button onClick={handleBack} className="mb-5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back
      </button>
      {step != null && (
        <>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            {stepLabel ?? `Step ${step} of ${totalSteps}`}
          </div>
          <div className="mt-1.5 mb-5 flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={
                  i + 1 === step
                    ? "h-1.5 w-[18px] rounded-[3px] bg-primary"
                    : "h-1.5 w-1.5 rounded-full bg-border"
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
