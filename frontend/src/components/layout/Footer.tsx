import React from "react";

const Footer: React.FC = () => (
  <footer className="h-12 border-t bg-white flex items-center justify-center text-xs text-slate-600">
    (c) {new Date().getFullYear()} Hospital Management System
  </footer>
);

export default Footer;
