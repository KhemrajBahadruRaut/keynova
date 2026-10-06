"use client";

import { useCallback, useState } from "react";

export function useFormValidation<Field extends string>(
  values: Record<Field, string>,
  validators: Record<Field, (value: string) => string>,
) {
  const [validatedFields, setValidatedFields] = useState<
    Partial<Record<Field, boolean>>
  >({});
  const fields = Object.keys(validators) as Field[];
  const errors: Partial<Record<Field, string>> = {};

  for (const field of fields) {
    if (validatedFields[field]) errors[field] = validators[field](values[field]);
  }

  const validateField = useCallback((field: Field) => {
    setValidatedFields((previous) => ({ ...previous, [field]: true }));
  }, []);

  function validateForm() {
    const nextValidatedFields: Partial<Record<Field, boolean>> = {};
    let valid = true;
    for (const field of fields) {
      nextValidatedFields[field] = true;
      if (validators[field](values[field])) valid = false;
    }
    setValidatedFields(nextValidatedFields);
    return valid;
  }

  const resetValidation = useCallback(() => {
    setValidatedFields({});
  }, []);

  function fieldAttributes(field: Field, errorId: string) {
    return {
      "aria-invalid": Boolean(errors[field]),
      "aria-describedby": errorId,
      onBlur: () => validateField(field),
    };
  }

  return { errors, validateField, validateForm, resetValidation, fieldAttributes };
}
