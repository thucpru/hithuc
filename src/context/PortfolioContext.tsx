import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Profile, ProjectType } from '@/types/content';

interface PortfolioState {
  profile: Profile | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
}

interface PortfolioContextType extends PortfolioState {
  getProjectBySlug: (slug: string) => Project | undefined;
  getProjectsByType: (type: ProjectType) => Project[];
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const byOrder = (a: Project, b: Project) =>
  (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortfolioState>({
    profile: null,
    projects: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, projectsRes] = await Promise.all([
          fetch('/data/profile.json'),
          fetch('/data/projects.json'),
        ]);

        if (!profileRes.ok || !projectsRes.ok) {
          throw new Error('Failed to fetch portfolio data');
        }

        const profile: Profile = await profileRes.json();
        const projects: Project[] = await projectsRes.json();

        setState({
          profile,
          projects: [...projects].sort(byOrder),
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          profile: null,
          projects: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load portfolio data',
        });
      }
    };

    loadData();
  }, []);

  const getProjectBySlug = (slug: string) => state.projects.find((p) => p.slug === slug);
  const getProjectsByType = (type: ProjectType) => state.projects.filter((p) => p.type === type);

  return (
    <PortfolioContext.Provider value={{ ...state, getProjectBySlug, getProjectsByType }}>
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
