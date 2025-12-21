import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Footer from "./Footer";

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-gradient-to-br from-slate-100 via-white to-primary-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-8 bg-slate-50/60">
          <div className="max-w-7xl mx-auto glass-card rounded-2xl p-6">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
