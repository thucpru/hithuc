import { useState, useCallback } from 'react';

interface GalleryState {
  activeImageIndex: number;
  isAutoAdvancing: boolean;
}

export function useGallery(totalImages: number) {
  const [state, setState] = useState<GalleryState>({
    activeImageIndex: 0,
    isAutoAdvancing: false,
  });

  const goToImage = useCallback((index: number) => {
    if (index >= 0 && index < totalImages) {
      setState((prev) => ({ ...prev, activeImageIndex: index }));
    }
  }, [totalImages]);

  const goToNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeImageIndex: (prev.activeImageIndex + 1) % totalImages,
    }));
  }, [totalImages]);

  const goToPrevious = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeImageIndex: prev.activeImageIndex === 0 ? totalImages - 1 : prev.activeImageIndex - 1,
    }));
  }, [totalImages]);

  const toggleAutoAdvance = useCallback(() => {
    setState((prev) => ({ ...prev, isAutoAdvancing: !prev.isAutoAdvancing }));
  }, []);

  return {
    activeImageIndex: state.activeImageIndex,
    isAutoAdvancing: state.isAutoAdvancing,
    goToImage,
    goToNext,
    goToPrevious,
    toggleAutoAdvance,
  };
}
