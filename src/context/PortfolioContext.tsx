import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Profile, Post, ProjectType } from '@/types/content';

interface PortfolioState {
  profile: Profile | null;
  projects: Project[];
  posts: Post[];
  loading: boolean;
  error: string | null;
}

interface PortfolioContextType extends PortfolioState {
  getProjectBySlug: (slug: string) => Project | undefined;
  getProjectsByType: (type: ProjectType) => Project[];
  getPostBySlug: (slug: string) => Post | undefined;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const byOrder = (a: Project, b: Project) =>
  (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);

const byDateDesc = (a: Post, b: Post) =>
  (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');

/**
 * Fetch JSON from the Worker API (`/api/*`), falling back to the static file
 * shipped in `public/data/*` when the API is unavailable (local `vite dev`,
 * or a pure-static deploy without the Worker). The API returns the same
 * `{vi,en}` shape as the static files, so callers don't care which won.
 */
async function fetchContent<T>(apiPath: string, staticPath: string): Promise<T> {
  try {
    const res = await fetch(apiPath);
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      return (await res.json()) as T;
    }
  } catch {
    // fall through to static
  }
  const res = await fetch(staticPath);
  if (!res.ok) throw new Error(`Failed to fetch ${staticPath}`);
  return (await res.json()) as T;
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortfolioState>({
    profile: null,
    projects: [],
    posts: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profile, projects, posts] = await Promise.all([
          fetchContent<Profile>('/api/profile', '/data/profile.json'),
          fetchContent<Project[]>('/api/projects', '/data/projects.json'),
          fetchContent<Post[]>('/api/posts', '/data/posts.json'),
        ]);

        setState({
          profile,
          projects: [...projects].sort(byOrder),
          posts: posts.filter((p) => p.status === 'published').sort(byDateDesc),
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          profile: null,
          projects: [],
          posts: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load portfolio data',
        });
      }
    };

    loadData();
  }, []);

  const getProjectBySlug = (slug: string) => state.projects.find((p) => p.slug === slug);
  const getProjectsByType = (type: ProjectType) => state.projects.filter((p) => p.type === type);
  const getPostBySlug = (slug: string) => state.posts.find((p) => p.slug === slug);

  return (
    <PortfolioContext.Provider
      value={{ ...state, getProjectBySlug, getProjectsByType, getPostBySlug }}
    >
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
