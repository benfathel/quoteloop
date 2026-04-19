"use client";

import { useState } from "react";
import { countryCodes, defaultCountryCode } from "@/lib/country-codes";

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  error,
  disabled,
}: PhoneInputProps) {
  // Parse initial value to extract country code and number
  const initialCode =
    countryCodes.find((c) => value.startsWith(c.dial))?.dial ||
    defaultCountryCode.dial;
  const initialNumber = value.startsWith(initialCode)
    ? value.slice(initialCode.length)
    : value;

  const [dialCode, setDialCode] = useState(initialCode);
  const [number, setNumber] = useState(initialNumber);

  function handleDialChange(newDial: string) {
    setDialCode(newDial);
    onChange(newDial + number);
  }

  function handleNumberChange(newNumber: string) {
    // Only allow digits
    const digits = newNumber.replace(/\D/g, "");
    setNumber(digits);
    onChange(dialCode + digits);
  }

  return (
    <div>
      <div className="flex gap-2">
        <select
          value={dialCode}
          onChange={(e) => handleDialChange(e.target.value)}
          disabled={disabled}
          className="input-dark w-[100px] shrink-0 appearance-none"
          aria-label="Country code"
        >
          {countryCodes.map((c) => (
            <option key={c.code + c.dial} value={c.dial}>
              {c.code} {c.dial}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          value={number}
          onChange={(e) => handleNumberChange(e.target.value)}
          disabled={disabled}
          placeholder="Phone number"
          className="input-dark flex-1"
        />
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-1.5">{error}</p>
      )}
    </div>
  );
}
