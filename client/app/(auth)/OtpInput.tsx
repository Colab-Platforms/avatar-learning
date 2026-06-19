"use client";

import { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function OtpInput({
  value,
  onChange,
  disabled,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from(
    { length: 6 },
    (_, index) => value[index] ?? ""
  );

  const update = (index: number, char: string) => {
    const next = [...digits];
    next[index] = char;
    onChange(next.join(""));
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);

    update(index, char);

    if (char && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        update(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        update(index - 1, "");
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (
    e: ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    onChange(pasted);

    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`OTP digit ${index + 1}`}
          className={cn(
            "h-12 w-12 rounded-xl border",
            "text-center text-lg font-semibold",
            "bg-gray-900 text-white",
            "border-gray-600",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:opacity-50",
            digit && "border-blue-500"
          )}
        />
      ))}
    </div>
  );
}