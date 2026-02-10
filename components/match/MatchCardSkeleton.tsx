export default function MatchCardSkeleton() {
  return (
    <div className="bg-surface-900 rounded-2xl border border-surface-800 p-4 animate-pulse">
      {/* Header: title + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 bg-surface-800 rounded-lg w-40" />
        <div className="h-4 bg-surface-800 rounded-full w-16 shrink-0" />
      </div>

      {/* Date + time */}
      <div className="flex items-center gap-1.5 mt-2.5">
        <div className="w-4 h-4 rounded-full bg-surface-800 shrink-0" />
        <div className="h-3.5 bg-surface-800 rounded-lg w-44" />
      </div>

      {/* Venue + city */}
      <div className="flex items-center gap-1.5 mt-2">
        <div className="w-4 h-4 rounded-full bg-surface-800 shrink-0" />
        <div className="h-3.5 bg-surface-800 rounded-lg w-32" />
        <div className="h-3 bg-surface-800 rounded-lg w-16" />
      </div>

      {/* Terrain badge + operator */}
      <div className="flex items-center gap-2 mt-3">
        <div className="h-4 bg-surface-800 rounded-full w-16" />
        <div className="h-3 bg-surface-800 rounded-lg w-24" />
      </div>

      {/* Spots progress */}
      <div className="mt-3 pt-3 border-t border-surface-800">
        <div className="flex items-center justify-between mb-1.5">
          <div className="h-3 bg-surface-800 rounded-lg w-20" />
          <div className="h-3 bg-surface-800 rounded-lg w-10" />
        </div>
        <div className="w-full h-1.5 bg-surface-800 rounded-full" />
      </div>
    </div>
  );
}
