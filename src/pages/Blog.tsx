import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { usePortfolio } from '@/context/PortfolioContext';
import { useLanguage } from '@/context/LanguageContext';
import { GallerySkeleton } from '@/components/gallery/GallerySkeleton';
import { SEO } from '@/components/seo/SEO';
import { UI_TEXT } from '@/lib/labels';
import { formatDate } from '@/lib/format';

export default function Blog() {
  const { posts, profile, loading, error } = usePortfolio();
  const { lang, t } = useLanguage();

  useEffect(() => {
    document.title = `${t(UI_TEXT.blog)} — ${profile?.name ?? 'hithuc'}`;
  }, [t, profile]);

  if (loading) {
    return (
      <Layout fullPage>
        <SEO title="Loading…" description="Loading blog" />
        <GallerySkeleton />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout fullPage>
        <SEO title="Error" description="Error loading blog" />
        <p className="text-destructive">{t(UI_TEXT.loadError)}</p>
      </Layout>
    );
  }

  return (
    <Layout fullPage>
      <SEO
        title={`${t(UI_TEXT.blog)} — ${profile?.name ?? 'hithuc'}`}
        description={profile ? t(profile.tagline) : ''}
        type="website"
      />

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">{t(UI_TEXT.blog)}</h1>

      {posts.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{t(UI_TEXT.noPosts)}</p>
      ) : (
        <ul className="mt-8 divide-y divide-gray-200">
          {posts.map((post) => (
            <li key={post.slug} className="py-6">
              <Link to={`/blog/${post.slug}`} className="group block">
                <p className="text-sm text-muted-foreground">{formatDate(post.publishedAt, lang)}</p>
                <h2 className="mt-1 font-serif text-xl font-semibold text-foreground group-hover:underline">
                  {t(post.title)}
                </h2>
                <p className="mt-1 text-gray-700 line-clamp-2">{t(post.excerpt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
