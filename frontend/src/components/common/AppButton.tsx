import React from "react";
import clsx from "clsx";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

const styles: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95 focus-visible:ring-indigo-300",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-indigo-700 hover:border-indigo-300 shadow-sm active:scale-95",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95",
};

const AppButton: React.FC<Props> = ({ variant = "primary", className, children, ...rest }) => {
  return (
    <button
      className={clsx(
        "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 transform",
        styles[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export default AppButton;
