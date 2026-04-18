import { useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

const InviteSent = () => {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: { name?: string; type?: string; freq?: string } };
  const name = state?.name || "your connection";
  const type = state?.type || "Close family";
  const freq = state?.freq || "1× / month";

  return (
    <div className="bg-gradient-teal flex min-h-full flex-col items-center px-8 pb-12 pt-[60px]">
      <div className="anim-fade-up mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full border-[1.5px] border-foreground bg-success">
        <Check className="h-7 w-7 text-white" strokeWidth={2.5} />
      </div>
      <h1 className="font-display anim-fade-up anim-d1 mb-2 text-center text-[28px] font-semibold">
        Invite sent to {name.split(/\s+/)[0]}!
      </h1>
      <p className="anim-fade-up anim-d2 mb-7 max-w-[260px] text-center text-[14px] leading-[1.6] text-muted-foreground">
        Once they join and connect their calendar, Togather will start finding windows for you both.
      </p>

      <div className="anim-fade-up anim-d2 mb-6 w-full rounded-[18px] border-[1.5px] border-border bg-white p-4">
        <Row k="Connection" v={name} />
        <Row k="Type" v={type} />
        <Row k="Goal" v={`Quality time · ${freq}`} />
        <Row k="Activity" v="Mild outdoor · Free" />
      </div>

      <button
        onClick={() => nav("/home")}
        className="anim-fade-up anim-d3 w-full rounded-full bg-primary px-6 py-3.5 text-[14px] font-medium text-white"
      >
        Go to my home
      </button>
      <button
        onClick={() => nav("/add-connection")}
        className="anim-fade-up anim-d3 mt-3 text-[13px] text-muted-foreground underline"
      >
        + Add another connection
      </button>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between py-1 text-[13px]">
    <span className="text-muted-foreground">{k}</span>
    <span className="font-medium">{v}</span>
  </div>
);

export default InviteSent;
