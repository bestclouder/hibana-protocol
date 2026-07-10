export default function FeedLoading() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="h-9 w-72 bg-sand rounded animate-pulse mb-2" />
      <div className="h-4 w-96 max-w-full bg-sand/70 rounded animate-pulse mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-sand/60 rounded animate-pulse" />
          ))}
        </div>
        <div className="space-y-10">
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 w-72 shrink-0 bg-card border border-sand rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-card border border-sand rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
