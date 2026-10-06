"use client";

import { useLayoutEffect, useRef, type InputHTMLAttributes } from "react";

import { editPhoneNumber, formatPhoneNumber } from "@/lib/phone";

type PhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange" | "maxLength"
> & {
  value: string;
  onValueChange: (digits: string) => void;
};

export default function PhoneInput({
  value,
  onValueChange,
  placeholder = "(774) 287-6819",
  autoComplete = "tel",
  inputMode = "numeric",
  ...props
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input && pendingCaret.current !== null) {
      input.setSelectionRange(pendingCaret.current, pendingCaret.current);
    }
    pendingCaret.current = null;
  });

  return (
    <input
      {...props}
      ref={inputRef}
      type="tel"
      inputMode={inputMode}
      autoComplete={autoComplete}
      placeholder={placeholder}
      pattern="\([0-9]{3}\) [0-9]{3}-[0-9]{4}"
      maxLength={14}
      value={formatPhoneNumber(value)}
      onChange={(event) => {
        const input = event.currentTarget;
        const edit = editPhoneNumber(
          value,
          input.value,
          input.selectionStart ?? input.value.length,
          (event.nativeEvent as InputEvent).inputType,
        );
        input.value = edit.formatted;
        input.setSelectionRange(edit.caret, edit.caret);
        pendingCaret.current = edit.caret;
        onValueChange(edit.digits);
      }}
    />
  );
}
