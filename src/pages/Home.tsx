import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { usePortfolio } from '@/context/PortfolioContext';
import { useT } from '@/context/LanguageContext';
import { ProjectCard } from '@/components/work/ProjectCard';
import { GallerySkeleton } from '@/components/gallery/GallerySkeleton';
import { SEO } from '@/components/seo/SEO';
import { PROJECT_TYPES, ProjectType } from '@/types/content';
import { TYPE_LABELS, UI_TEXT } from '@/lib/labels';

export default function Home() {
  const { projects, profile, loading, error } = usePortfolio();
  const t = useT();

  useEffect(() => {
    if (profile) document.title = `${profile.name} — ${t(profile.tagline)}`;
  }, [profile, t]);

  if (loading) {
    return (
      <Layout fullPage>
        <SEO title="Loading…" description="Loading portfolio" />
        <GallerySkeleton />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout fullPage>
        <SEO title="Error" description="Error loading portfolio" />
        <div className="text-center max-w-md">
          <p className="text-destructive font-semibold">{t(UI_TEXT.loadError)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-foreground text-background rounded hover:opacity-80 transition-opacity"
          >
            {t(UI_TEXT.retry)}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullPage>
      <SEO
        title={profile ? `${profile.name} — ${t(profile.tagline)}` : 'hithuc.com'}
        description={profile ? t(profile.tagline) : ''}
        type="website"
      />

      {profile && (
        <section className="max-w-2xl">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[2.25rem] leading-tight text-foreground">
            {t(profile.tagline)}
          </h2>
        </section>
      )}

      <div className="mt-10 space-y-14">
        {PROJECT_TYPES.map((type) => (
          <TypeSection key={type} type={type} />
        ))}
      </div>
    </Layout>
  );

  function TypeSection({ type }: { type: ProjectType }) {
    const items = projects.filter((p) => p.type === type).slice(0, 3);
    if (items.length === 0) return null;

    return (
      <section>
        <div className="flex items-baseline justify-between border-b border-gray-200 pb-3">
          <h3 className="font-serif text-xl font-semibold text-foreground">{t(TYPE_LABELS[type])}</h3>
          <Link to={`/work/${type}`} className="text-sm text-muted-foreground hover:text-foreground">
            {t(UI_TEXT.viewAll)} →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    );
  }
}
