import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasOnboarded } from "./Welcome";
import holdingHands from "@/assets/holding-hands.svg";

const Splash = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  if (!loading && user) return <Navigate to="/home" replace />;
  if (!loading && !user && !hasOnboarded()) return <Navigate to="/welcome" replace />;

  return (
    <div className="bg-gradient-splash flex min-h-full flex-col items-center justify-center px-8 pb-12 pt-20 text-center">
      <img src={holdingHands} alt="Togather" className="anim-fade-up mb-7 h-72 w-72 object-contain" />
      <h1 className="anim-fade-up font-display mb-3 text-[36px] font-semibold leading-[1.1] text-foreground">
        Spend your time
        <br />
        <em className="text-primary">intentionally.</em>
      </h1>
      <p className="anim-fade-up anim-d1 mb-12 max-w-[260px] text-[15px] leading-[1.6] text-muted-foreground">
        Togather finds the time, plans the activity, and coordinates connection building for you.
      </p>
      <div className="w-full max-w-[320px] space-y-3">
        <button
          onClick={() => nav("/auth?mode=signup")}
          className="anim-fade-up anim-d2 w-full rounded-full bg-foreground px-6 py-3.5 text-[15px] font-medium text-white"
        >
          Get started — it's free
        </button>
        <Link
          to="/auth?mode=signin"
          className="anim-fade-up anim-d3 block w-full rounded-full border-[1.5px] border-border bg-transparent px-6 py-3.5 text-center text-[14px] text-muted-foreground"
        >
          I already have an account
        </Link>
      </div>
    </div>
  );
};

export default Splash;
