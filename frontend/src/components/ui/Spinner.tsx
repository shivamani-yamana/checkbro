import React from "react";
import styles from "./Spinner.module.css";

interface SpinnerProps {
  color?: string;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  color = "#ffffff",
  className = "",
}) => {
  return (
    <div
      className={`w-full h-full relative flex items-center justify-center ${className}`}
    >
      <svg
        className="w-full h-full absolute inset-0"
        viewBox="0 0 800 800"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle
          className={styles.spin2}
          cx="400"
          cy="400"
          fill="none"
          r="200"
          strokeWidth="32"
          stroke={color}
          strokeDasharray="629 1400"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default Spinner;
