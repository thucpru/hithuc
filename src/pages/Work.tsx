import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { usePortfolio } from '@/context/PortfolioContext';
import { useT } from '@/context/LanguageContext';
import { ProjectCard } from '@/components/work/ProjectCard';
import { GallerySkeleton } from '@/components/gallery/GallerySkeleton';
import { SEO } from '@/components/seo/SEO';
import { PROJECT_TYPES, ProjectType, isProjectType } from '@/types/content';
import { TYPE_LABELS, UI_TEXT } from '@/lib/labels';

export default function Work() {
  const { type } = useParams<{ type?: string }>();
  const { projects, profile, loading, error } = usePortfolio();
  const t = useT();

  const activeType = type && isProjectType(type) ? (type as ProjectType) : undefined;

  useEffect(() => {
    document.title = `${t(UI_TEXT.allWork)} — ${profile?.name ?? 'hithuc'}`;
  }, [t, profile]);

  if (type && !isProjectType(type)) {
    return <Navigate to="/work" replace />;
  }

  if (loading) {
    return (
      <Layout fullPage>
        <SEO title="Loading…" description="Loading work" />
        <GallerySkeleton />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout fullPage>
        <SEO title="Error" description="Error loading work" />
        <p className="text-destructive">{t(UI_TEXT.loadError)}</p>
      </Layout>
    );
  }

  const visible = activeType ? projects.filter((p) => p.type === activeType) : projects;

  return (
    <Layout fullPage>
      <SEO
        title={`${t(UI_TEXT.allWork)} — ${profile?.name ?? 'hithuc'}`}
        description={profile ? t(profile.tagline) : ''}
        type="website"
      />

      <nav className="flex flex-wrap gap-4 border-b border-gray-200 pb-4">
        <FilterLink to="/work" active={!activeType} label={t(UI_TEXT.allWork)} />
        {PROJECT_TYPES.map((pt) => (
          <FilterLink
            key={pt}
            to={`/work/${pt}`}
            active={activeType === pt}
            label={t(TYPE_LABELS[pt])}
          />
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{t(UI_TEXT.noProjects)}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </Layout>
  );
}

function FilterLink({ to, active, label }: { to: string; active: boolean; label: string }) {
  return (
    <Link
      to={to}
      className={`text-base transition-colors ${
        active ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </Link>
  );
}
