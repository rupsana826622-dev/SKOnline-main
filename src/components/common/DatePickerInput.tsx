import React, { useRef } from "react";
import { Calendar } from "lucide-react";

interface DatePickerInputProps {
  value: string; // DD/MM/YYYY
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
}

/**
 * Converts "DD/MM/YYYY" -> "YYYY-MM-DD" for native HTML5 date input.
 */
function toIsoDate(ddmmyyyy: string): string {
  if (!ddmmyyyy) return "";
  const parts = ddmmyyyy.trim().split(/[-/]/);
  if (parts.length === 3) {
    const d = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    const y = parts[2];
    if (y.length === 4) return `${y}-${m}-${d}`;
  }
  return "";
}

/**
 * Converts "YYYY-MM-DD" -> "DD/MM/YYYY" for standard form display.
 */
function fromIsoDate(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

export default function DatePickerInput({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  className = "",
  readOnly = false,
  disabled = false,
}: DatePickerInputProps) {
  const nativePickerRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    let formatted = "";
    if (digits.length > 0) formatted += digits.substring(0, 2);
    if (digits.length >= 2) formatted += "/" + digits.substring(2, 4);
    if (digits.length >= 4) formatted += "/" + digits.substring(4, 8);
    onChange(formatted);
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value;
    if (isoVal) {
      onChange(fromIsoDate(isoVal));
    }
  };

  const handleOpenPicker = () => {
    if (readOnly || disabled) return;
    if (nativePickerRef.current) {
      if (typeof nativePickerRef.current.showPicker === "function") {
        nativePickerRef.current.showPicker();
      } else {
        nativePickerRef.current.focus();
        nativePickerRef.current.click();
      }
    }
  };

  const isoValue = toIsoDate(value);

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        value={value || ""}
        onChange={handleTextChange}
        placeholder={placeholder}
        maxLength={10}
        readOnly={readOnly}
        disabled={disabled}
        className={`form-input font-mono pr-10 w-full ${readOnly ? "bg-slate-50 cursor-default" : ""} ${className}`}
      />
      
      {/* Hidden native datepicker for popup calendar */}
      <input
        ref={nativePickerRef}
        type="date"
        value={isoValue}
        onChange={handleNativeDateChange}
        disabled={disabled || readOnly}
        tabIndex={-1}
        className="absolute opacity-0 pointer-events-none w-0 h-0 right-0"
      />

      <button
        type="button"
        onClick={handleOpenPicker}
        disabled={disabled || readOnly}
        title="Open interactive calendar"
        className="absolute right-2.5 p-1 text-slate-400 hover:text-blue-600 focus:outline-none transition-colors"
      >
        <Calendar size={16} />
      </button>
    </div>
  );
}
