import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PhotographerProfile } from '@/types/photographer';
import { PortfolioSeries } from '@/types/gallery';

interface PortfolioState {
  photographer: PhotographerProfile | null;
  series: PortfolioSeries[];
  loading: boolean;
  error: string | null;
}

interface PortfolioContextType extends PortfolioState {
  getSeriesBySlug: (slug: string) => PortfolioSeries | undefined;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortfolioState>({
    photographer: null,
    series: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load photographer profile
        const photographerResponse = await fetch('/data/photographer.json');
        const photographerData = await photographerResponse.json();

        // Load all series
        const seriesSlugs = ['portraits', 'documentary', 'editorial'];
        const seriesPromises = seriesSlugs.map(async (slug) => {
          const response = await fetch(`/data/series/${slug}.json`);
          return response.json();
        });

        const seriesData = await Promise.all(seriesPromises);

        setState({
          photographer: photographerData,
          series: seriesData,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          photographer: null,
          series: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load portfolio data',
        });
      }
    };

    loadData();
  }, []);

  const getSeriesBySlug = (slug: string) => {
    return state.series.find((s) => s.slug === slug);
  };

  return (
    <PortfolioContext.Provider value={{ ...state, getSeriesBySlug }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
