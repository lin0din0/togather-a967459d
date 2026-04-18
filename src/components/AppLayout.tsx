import { Outlet, useLocation } from "react-router-dom";
import { TabBar } from "./TabBar";

const HIDE_TABBAR = ["/", "/welcome", "/auth", "/forgot-password", "/reset-password", "/calendar-connect", "/budget", "/add-connection", "/invite-sent"];

const AppLayout = () => {
  const { pathname } = useLocation();
  const showTabBar = !HIDE_TABBAR.includes(pathname);

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-2 py-4 sm:px-4 sm:py-8 md:px-6 md:py-10">
      {/* Phone shell — decorative on desktop, edge-to-edge on phones */}
      <div className="w-full max-w-[390px] rounded-[3.25rem] bg-[#1A1A1A] p-[13px] shadow-phone sm:my-4">
        <div className="relative h-[844px] max-h-[calc(100vh-4rem)] overflow-hidden rounded-[2.6rem] bg-surface">
          {/* Notch (decorative) */}
          <div className="pointer-events-none absolute left-1/2 top-[10px] z-50 h-[34px] w-[120px] -translate-x-1/2 rounded-[20px] bg-[#1A1A1A]" />
          {/* Screen scroll area */}
          <div className="scrollbar-none h-full overflow-y-auto overflow-x-hidden">
            <Outlet />
            {showTabBar && <div aria-hidden className="h-[100px]" />}
          </div>
          {showTabBar && <TabBar />}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
