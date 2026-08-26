import React from "react";

interface CharacterGridProps {
  value?: string;
  length: number;
  className?: string;
  boxWidth?: string;
  boxHeight?: string;
  fontSize?: string;
}

export const CharacterGrid: React.FC<CharacterGridProps> = ({
  value = "",
  length,
  className = "",
  boxWidth = "18px",
  boxHeight = "20px",
  fontSize = "12px",
}) => {
  const chars = (value || "").toUpperCase().split("");
  const boxes = Array.from({ length }, (_, i) => chars[i] || "");

  return (
    <div className={`flex items-center flex-nowrap ${className}`}>
      {boxes.map((char, index) => (
        <div
          key={index}
          style={{
            width: boxWidth,
            height: boxHeight,
            fontSize: fontSize,
            minWidth: boxWidth,
          }}
          className="border border-black flex items-center justify-center font-mono font-bold text-black bg-white -ml-[1px] first:ml-0 overflow-hidden select-none"
        >
          {char}
        </div>
      ))}
    </div>
  );
};
