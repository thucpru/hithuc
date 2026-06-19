export function GallerySkeleton() {
  return (
    <div className="relative w-full max-w-[1200px]">
      <div className="flex h-[36.875rem] items-center justify-center gap-3 lg:gap-5">
        {/* Desktop: 6 skeleton boxes matching corrected expand-on-hover widths */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 h-full bg-gray-200 animate-pulse rounded-3xl"
            style={{
              width: i === 1 ? '25.78125rem' : '8.59375rem', // Match corrected expand-on-hover widths
            }}
          />
        ))}
      </div>

      {/* Loading text centered */}
      <div className="flex justify-center mt-6">
        <div className="flex items-center gap-3">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="text-muted-foreground text-sm">Loading gallery...</p>
        </div>
      </div>
    </div>
  );
}
