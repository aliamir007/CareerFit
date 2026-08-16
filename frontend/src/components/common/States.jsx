import Button from "./Button";

/**
 * Empty states are an invitation to act, not a report of absence — every one of
 * these takes an action, and callers are expected to pass one.
 */
export function EmptyState({ title, description, action, onAction }) {
  return (
    <div className="card flex flex-col items-center px-8 py-16 text-center animate-fade-up">
      <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
      <h3 className="display text-xl">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}

/**
 * Errors say what happened and what to do next. `message` is the backend's own
 * message, surfaced verbatim rather than paraphrased into something vaguer.
 */
export function ErrorState({ message, onRetry, retryLabel = "Try again" }) {
  return (
    <div className="card border-brick/40 px-8 py-12 text-center animate-fade-up">
      <p className="label text-brick">Something went wrong</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export function InlineError({ message }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="border-l-2 border-brick bg-brick/5 px-3 py-2 text-sm text-brick"
    >
      {message}
    </p>
  );
}
