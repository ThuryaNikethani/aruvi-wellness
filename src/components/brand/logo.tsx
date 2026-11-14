type LogoProps = { className?: string; showWordmark?: boolean; label?: string };

/** ARUVI mark: a single water drop holding a gentle stream ("aruvi" = stream / waterfall). */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="18" fill="var(--leaf)" />
      <path d="M32 10c9 11 16 20 16 29a16 16 0 0 1-32 0c0-9 7-18 16-29Z" fill="var(--leaf-soft)" />
      <path
        d="M21 40c4-3 7-3 11 0s7 3 11 0M23 47c3-2 6-2 9 0s6 2 9 0"
        fill="none"
        stroke="var(--stream)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className = "", showWordmark = true, label = "ARUVI" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      {showWordmark ? (
        <span className="font-display text-xl font-semibold tracking-[0.18em] text-ink">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}
