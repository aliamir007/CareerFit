/**
 * The signature element. The whole product is about matching, so match strength
 * gets one consistent treatment: a horizontal hairline track, a gold fill, and
 * the percentage set in mono.
 *
 * It renders identically on JobRecommendationCard and CandidateCard so the same
 * visual always means "this is my match strength", whichever side you are on.
 */
export default function MatchMeter({ value, label = "Match", size = "md" }) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

  const bar = size === "sm" ? "h-1" : "h-1.5";
  const figure = size === "sm" ? "text-lg" : "text-2xl";

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="label">{label}</span>
        <span className={`numeric ${figure} font-medium leading-none text-ink`}>
          {pct}
          <span className="ml-0.5 text-[0.6em] text-muted">%</span>
        </span>
      </div>

      <div
        className={`relative w-full ${bar} bg-hairline`}
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct} percent`}
      >
        <div
          className="absolute inset-y-0 left-0 origin-left animate-meter-fill bg-gold"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
