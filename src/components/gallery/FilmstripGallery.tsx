import { FilmstripGalleryProps } from '@/types/gallery';
import { HoverExpand_001 } from '@/components/ui/expand-on-hover';
import { cn } from '@/lib/utils';

export function FilmstripGallery({ images, className = '' }: FilmstripGalleryProps) {

  // Transform gallery images to format expected by HoverExpand_001
  const transformedImages = images.map((image) => ({
    src: image.src,
    alt: image.alt,
    code: `${image.metadata.title} - ${image.metadata.year}`,
  }));

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">No images to display</p>
      </div>
    );
  }

  return (
    <HoverExpand_001 images={transformedImages} className={className} />
  );
}
