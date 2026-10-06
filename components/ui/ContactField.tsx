import type { ReactNode } from "react";

export default function ContactField({
  children,
  error,
  errorId,
  className = "",
}: {
  children: ReactNode;
  error?: string;
  errorId: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      {children}
      <p
        id={errorId}
        aria-live="polite"
        className={error ? "mt-1 text-xs text-red-600" : "sr-only"}
      >
        {error}
      </p>
    </div>
  );
}
