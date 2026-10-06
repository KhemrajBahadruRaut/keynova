export default function FieldError({ id, error }: { id: string; error?: string }) {
  return (
    <span
      id={id}
      aria-live="polite"
      className={error ? "mt-1 block text-xs font-normal text-red-600" : "sr-only"}
    >
      {error}
    </span>
  );
}
