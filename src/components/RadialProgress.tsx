// src/components/RadialProgress.tsx
import React from 'react';

interface RadialProgressProps {
  value: number;
  label: string;
  icon: React.ReactNode;
}

const RadialProgress: React.FC<RadialProgressProps> = ({ value, label, icon }) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative h-32 w-32">
        <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 100 100">
          <circle
            className="text-gray-700"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
          <circle
            className="text-blue-500"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
        </svg>
        <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center">
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-semibold">{value.toFixed(2)}</p>
        <p className="text-gray-400 capitalize">{label}</p>
      </div>
    </div>
  );
};

export default RadialProgress;
