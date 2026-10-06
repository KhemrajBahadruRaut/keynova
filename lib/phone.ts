export function phoneDigits(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function formatPhoneNumber(value: string) {
  const digits = phoneDigits(value);
  if (!digits) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// Track the caret by digits so adding punctuation does not interrupt editing.
export function editPhoneNumber(
  previousValue: string,
  inputValue: string,
  selectionStart: number,
  inputType = "",
) {
  let digits = phoneDigits(inputValue).slice(0, 10);
  let digitPosition = Math.min(phoneDigits(inputValue.slice(0, selectionStart)).length, digits.length);

  // Deleting a separator should remove the adjacent digit, too.
  if (digits === phoneDigits(previousValue)) {
    if (inputType === "deleteContentBackward" && digitPosition > 0) {
      digits = digits.slice(0, digitPosition - 1) + digits.slice(digitPosition);
      digitPosition -= 1;
    } else if (inputType === "deleteContentForward" && digitPosition < digits.length) {
      digits = digits.slice(0, digitPosition) + digits.slice(digitPosition + 1);
    }
  }

  const formatted = formatPhoneNumber(digits);
  let caret = formatted.startsWith("(") ? 1 : 0;
  let count = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/[0-9]/.test(formatted[index])) {
      count += 1;
      if (count === digitPosition) {
        caret = index + 1;
        break;
      }
    }
  }
  return { digits, formatted, caret };
}
