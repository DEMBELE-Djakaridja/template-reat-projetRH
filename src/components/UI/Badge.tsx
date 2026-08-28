interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "default" | "pending" | "orange";
  children: React.ReactNode;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  success: "bg-green-50 text-green-700 border border-green-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  default: "bg-gray-100 text-gray-600 border border-gray-200",
  pending: "bg-orange-50 text-orange-600 border border-orange-200",
  orange: "bg-orange-500 text-white",
};

const dotColors = {
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  default: "bg-gray-400",
  pending: "bg-orange-400",
  orange: "bg-white",
};

export default function Badge({ variant = "default", children, dot = false, size = "md", className = "" }: BadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass} ${variants[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
