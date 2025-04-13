// In Button.tsx
interface ButtonProps {
  onClick: () => void;
  color: "green" | "blue" | "rose" | "gray" | "red" | "yellow";
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

function Button({
  onClick,
  color,
  children,
  disabled = false,
  className = "",
}: ButtonProps) {
  const colorClasses = {
    green: "bg-green-600 hover:bg-green-700 active:bg-green-800",
    blue: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
    rose: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800",
    gray: "bg-gray-600 hover:bg-gray-700 active:bg-gray-800",
    red: "bg-red-600 hover:bg-red-700 active:bg-red-800",
    yellow: "bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-white transition-all duration-200 flex items-center justify-center
        ${colorClasses[color]}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
