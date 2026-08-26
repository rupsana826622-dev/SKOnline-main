import React from "react";

interface FormContainerProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const FormContainer: React.FC<FormContainerProps> = ({ id, children, className = "" }) => {
  return (
    <div
      id={id}
      className={`a4-page bg-white text-black font-sans mx-auto box-border overflow-hidden relative shadow-lg print:shadow-none print:m-0 ${className}`}
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "10mm 12mm",
        boxSizing: "border-box",
        pageBreakAfter: "always",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {children}
    </div>
  );
};
