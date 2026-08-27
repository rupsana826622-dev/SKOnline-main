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
  fontSize = "11px",
}) => {
  const chars = (value || "").toUpperCase().split("");
  const boxes = Array.from({ length }, (_, i) => chars[i] || "");

  return (
    <div className={`flex items-center flex-nowrap ${className}`} style={{ display: "flex", flexWrap: "nowrap" }}>
      {boxes.map((char, index) => (
        <div
          key={index}
          style={{
            width: boxWidth,
            height: boxHeight,
            minWidth: boxWidth,
            maxWidth: boxWidth,
            fontSize: fontSize,
            lineHeight: "1",
            fontFamily: "monospace, 'Courier New', sans-serif",
            fontWeight: "600",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            verticalAlign: "middle",
            boxSizing: "border-box",
            padding: 0,
            margin: 0,
          }}
          className="border border-black text-black bg-white -ml-[1px] first:ml-0 overflow-hidden select-none"
        >
          <span style={{ display: "inline-block", lineHeight: "1", padding: 0, margin: 0 }}>
            {char}
          </span>
        </div>
      ))}
    </div>
  );
};

