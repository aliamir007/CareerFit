/**
 * A bare spinner tells the user nothing. Where a wait has stages (resume
 * parsing, AI scoring) callers pass a label saying what is actually happening.
 */
export default function Loader({ label = "Loading", fullscreen = true }) {
  const body = (
    <div className="flex flex-col items-center gap-3">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-hairline border-t-teal"
      />
      <p className="text-sm text-muted" role="status" aria-live="polite">
        {label}…
      </p>
    </div>
  );

  if (!fullscreen) return body;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      {body}
    </div>
  );
}
