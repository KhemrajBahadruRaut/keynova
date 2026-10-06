export type ValidationErrors = Record<string, string>;

const EMAIL_PATTERN = /^[a-z\d!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z\d!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,63}$/i;
const PHONE_CHARACTERS_PATTERN = /^[+\d\s().-]+$/;
const NAME_PATTERN = /^\p{L}[\p{L}\p{M}]*(?:(?: +|['\u2019-])\p{L}[\p{L}\p{M}]*)*$/u;

export function validateText(
  value: string,
  label: string,
  options: { required?: boolean; min?: number; max?: number } = {},
) {
  const { required = false, min = 0, max } = options;
  const trimmed = value.trim();

  if (!trimmed) return required ? `${label} is required.` : "";
  if (trimmed.length < min) {
    return `${label} must be at least ${min} characters.`;
  }
  if (max && trimmed.length > max) {
    return `${label} must be ${max} characters or fewer.`;
  }
  return "";
}

export function validateEmail(value: string, required = true) {
  const trimmed = value.trim();
  if (!trimmed) return required ? "Email address is required." : "";
  if (
    trimmed.length > 254 ||
    trimmed.split("@")[0].length > 64 ||
    !EMAIL_PATTERN.test(trimmed)
  ) {
    return "Enter a valid email address.";
  }
  return "";
}

export function validateName(value: string, label = "Name", max = 100) {
  const error = validateText(value, label, { required: true, max });
  if (error) return error;
  return NAME_PATTERN.test(value.trim())
    ? ""
    : `${label} must contain letters only, with spaces, hyphens, or apostrophes between words.`;
}

export function validateContactPhone(value: string) {
  if (!value.trim()) return "Phone number is required.";
  return /^[0-9]{10}$/.test(value.trim())
    ? ""
    : "Phone number must contain exactly 10 digits.";
}

export function validateMessage(value: string) {
  const error = validateText(value, "Message", { required: true, max: 5000 });
  if (error) return error;
  const words = value
    .trim()
    .split(/\s+/u)
    .filter((word) => /[\p{L}\p{N}]/u.test(word));
  return words.length >= 10 ? "" : "Message must contain at least 10 words.";
}

export const CONTACT_FIELD_VALIDATORS = {
  firstName: (value: string) => validateName(value, "First name"),
  lastName: (value: string) => validateName(value, "Last name"),
  email: validateEmail,
  message: validateMessage,
  phone: validateContactPhone,
};

export function validatePassword(value: string) {
  if (!value) return "Password is required.";
  if (value.length > 128) return "Password must be 128 characters or fewer.";
  return "";
}

export function validatePhone(value: string, required = false) {
  const trimmed = value.trim();
  if (!trimmed) return required ? "Phone number is required." : "";
  const digits = trimmed.replace(/\D/g, "");
  if (
    !PHONE_CHARACTERS_PATTERN.test(trimmed) ||
    digits.length < 7 ||
    digits.length > 15
  ) {
    return "Enter a valid phone number with 7 to 15 digits.";
  }
  return "";
}

export function validatePrice(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Sale price is required.";
  if (!/^\$?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(trimmed)) {
    return "Enter a valid price, such as $2,450,000.";
  }
  const amount = Number(trimmed.replace(/[$,]/g, ""));
  return Number.isFinite(amount) && amount > 0
    ? ""
    : "Sale price must be greater than zero.";
}

export function validateBuildingSize(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (
    !/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?(?:\s*(?:sf|sq\.?\s*ft\.?))?$/i.test(
      trimmed,
    )
  ) {
    return "Enter a valid size, such as 14,614 SF.";
  }
  const size = Number(
    trimmed.replace(/,/g, "").replace(/\s*(?:sf|sq\.?\s*ft\.?)$/i, ""),
  );
  return Number.isFinite(size) && size > 0
    ? ""
    : "Building size must be greater than zero.";
}

export function validateUnits(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^\d+$/.test(trimmed) || Number(trimmed) < 1) {
    return "Units must be a whole number greater than zero.";
  }
  return "";
}

export function validateYearBuilt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const latestYear = new Date().getFullYear() + 1;
  if (!/^\d{4}$/.test(trimmed)) return "Enter a four-digit year.";
  const year = Number(trimmed);
  if (year < 1600 || year > latestYear) {
    return `Year built must be between 1600 and ${latestYear}.`;
  }
  return "";
}

export function validateVerificationCode(value: string) {
  if (!value) return "Verification code is required.";
  return /^\d{6}$/.test(value) ? "" : "Enter the 6-digit verification code.";
}

export function validateNonNegativeNumber(
  value: string,
  label: string,
  integer = false,
) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const pattern = integer ? /^\d+$/ : /^\d+(?:\.\d+)?$/;
  if (!pattern.test(trimmed) || Number(trimmed) < 0) {
    return `${label} must be a non-negative${integer ? " whole" : ""} number.`;
  }
  return "";
}

export function hasValidationErrors(errors: ValidationErrors) {
  return Object.values(errors).some(Boolean);
}
