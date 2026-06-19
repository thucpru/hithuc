import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { usePortfolio } from '@/context/PortfolioContext';
import { useT } from '@/context/LanguageContext';
import { FilmstripGallery } from '@/components/gallery/FilmstripGallery';
import { Markdown } from '@/components/content/Markdown';
import { GallerySkeleton } from '@/components/gallery/GallerySkeleton';
import { SEO } from '@/components/seo/SEO';
import { TYPE_LABELS, UI_TEXT } from '@/lib/labels';
import NotFound from './NotFound';

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { projects, getProjectBySlug, profile, loading } = usePortfolio();
  const t = useT();

  const project = slug ? getProjectBySlug(slug) : undefined;

  useEffect(() => {
    if (project) document.title = `${t(project.title)} — ${profile?.name ?? 'hithuc'}`;
  }, [project, profile, t]);

  if (loading) {
    return (
      <Layout fullPage>
        <SEO title="Loading…" description="Loading project" />
        <GallerySkeleton />
      </Layout>
    );
  }

  if (!project) {
    return <NotFound />;
  }

  const index = projects.findIndex((p) => p.id === project.id);
  const prev = index > 0 ? projects[index - 1] : undefined;
  const next = index >= 0 && index < projects.length - 1 ? projects[index + 1] : undefined;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: t(project.title),
    description: t(project.summary),
    image: project.coverImage,
    keywords: project.tags.join(', '),
    dateCreated: project.year,
    creator: profile ? { '@type': 'Person', name: profile.name } : undefined,
  };

  return (
    <Layout fullPage>
      <SEO
        title={`${t(project.title)} — ${profile?.name ?? 'hithuc'}`}
        description={t(project.summary)}
        image={project.coverImage}
        type="article"
        structuredData={structuredData}
      />

      <article className="space-y-8">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            {t(TYPE_LABELS[project.type])}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-foreground">
            {t(project.title)}
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl">{t(project.summary)}</p>
        </header>

        {/* Hero cover */}
        <div className="overflow-hidden rounded-sm bg-gray-100">
          <img
            src={project.coverImage}
            alt={t(project.title)}
            className="w-full h-auto"
            loading="eager"
          />
        </div>

        {/* Meta + description */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="space-y-5 text-sm lg:col-span-1">
            {project.role && <MetaRow label={t(UI_TEXT.role)} value={project.role} />}
            {project.year && <MetaRow label={t(UI_TEXT.year)} value={project.year} />}
            {project.stack && project.stack.length > 0 && (
              <MetaRow label={t(UI_TEXT.stack)} value={project.stack.join(', ')} />
            )}
            {project.links && (project.links.live || project.links.repo || project.links.store) && (
              <div>
                <p className="font-semibold text-foreground mb-1">{t(UI_TEXT.links)}</p>
                <ul className="space-y-1">
                  {project.links.live && <LinkRow href={project.links.live} label={t(UI_TEXT.live)} />}
                  {project.links.repo && <LinkRow href={project.links.repo} label={t(UI_TEXT.repo)} />}
                  {project.links.store && <LinkRow href={project.links.store} label={t(UI_TEXT.store)} />}
                </ul>
              </div>
            )}
          </aside>

          <div className="lg:col-span-2">
            <Markdown>{t(project.description)}</Markdown>
          </div>
        </div>

        {/* Gallery */}
        {project.gallery.length > 0 && (
          <div className="pt-4">
            <FilmstripGallery images={project.gallery} />
          </div>
        )}

        {/* Prev / Next */}
        <nav className="flex justify-between gap-4 border-t border-gray-200 pt-6">
          <div>
            {prev && (
              <Link to={`/project/${prev.slug}`} className="group text-sm">
                <span className="block text-muted-foreground">← {t(UI_TEXT.prev)}</span>
                <span className="font-semibold text-foreground group-hover:underline">
                  {t(prev.title)}
                </span>
              </Link>
            )}
          </div>
          <div className="text-right">
            {next && (
              <Link to={`/project/${next.slug}`} className="group text-sm">
                <span className="block text-muted-foreground">{t(UI_TEXT.next)} →</span>
                <span className="font-semibold text-foreground group-hover:underline">
                  {t(next.title)}
                </span>
              </Link>
            )}
          </div>
        </nav>
      </article>
    </Layout>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-gray-700">{value}</p>
    </div>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-gray-700 underline hover:text-foreground"
      >
        {label}
      </a>
    </li>
  );
}
