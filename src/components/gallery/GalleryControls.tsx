import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GalleryControlsProps } from '@/types/gallery';

export function GalleryControls({
  onPrevious,
  onNext,
  canGoNext,
  canGoPrevious,
  currentIndex,
  totalImages,
  className = '',
}: GalleryControlsProps) {
  return (
    <div className={`flex items-center justify-center gap-6 mt-6 ${className}`}>
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="min-w-[44px] min-h-[44px] p-3 transition-opacity hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
        aria-label={`Previous image, currently viewing image ${currentIndex} of ${totalImages}`}
      >
        <ChevronLeft className="w-8 h-8 text-foreground" aria-hidden="true" />
      </button>
      
      <span className="text-sm text-muted-foreground" aria-hidden="true">
        {currentIndex} / {totalImages}
      </span>
      
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="min-w-[44px] min-h-[44px] p-3 transition-opacity hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
        aria-label={`Next image, currently viewing image ${currentIndex} of ${totalImages}`}
      >
        <ChevronRight className="w-8 h-8 text-foreground" aria-hidden="true" />
      </button>
    </div>
  );
}
