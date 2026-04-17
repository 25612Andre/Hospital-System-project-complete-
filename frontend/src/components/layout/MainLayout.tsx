import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Footer from "./Footer";

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex bg-gradient-to-br from-slate-100 via-white to-primary-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors">
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-3 sm:p-5 lg:p-8 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="mx-auto w-full max-w-7xl glass-card dark:bg-slate-800/50 dark:border-slate-700 rounded-2xl p-3 sm:p-5 lg:p-6">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
