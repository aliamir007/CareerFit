const VARIANTS = {
  primary:
    "bg-teal text-paper hover:bg-teal-deep disabled:bg-teal/40 disabled:cursor-not-allowed",
  secondary:
    "bg-transparent text-ink border border-hairline hover:border-ink disabled:opacity-40 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-teal hover:bg-teal/5 disabled:opacity-40 disabled:cursor-not-allowed",
  danger:
    "bg-brick text-white hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed",
};

export default function Button({
  children,
  variant = "primary",
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-medium transition-colors ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
