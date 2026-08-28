import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const paddings = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };

export default function Card({ children, className = "", padding = "md", hover = false }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${paddings[padding]} ${hover ? "stat-card cursor-pointer" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex items-center justify-between mb-5 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`font-semibold text-gray-800 font-[family-name:var(--font-display)] ${className}`}>{children}</h3>;
}
