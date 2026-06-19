import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { usePortfolio } from '@/context/PortfolioContext';
import { useLanguage } from '@/context/LanguageContext';
import { Markdown } from '@/components/content/Markdown';
import { GallerySkeleton } from '@/components/gallery/GallerySkeleton';
import { SEO } from '@/components/seo/SEO';
import { UI_TEXT } from '@/lib/labels';
import { formatDate } from '@/lib/format';
import NotFound from './NotFound';

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { getPostBySlug, profile, loading } = usePortfolio();
  const { lang, t } = useLanguage();

  const post = slug ? getPostBySlug(slug) : undefined;

  useEffect(() => {
    if (post) document.title = `${t(post.title)} — ${profile?.name ?? 'hithuc'}`;
  }, [post, profile, t]);

  if (loading) {
    return (
      <Layout fullPage>
        <SEO title="Loading…" description="Loading post" />
        <GallerySkeleton />
      </Layout>
    );
  }

  if (!post) {
    return <NotFound />;
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: t(post.title),
    description: t(post.excerpt),
    image: post.cover,
    datePublished: post.publishedAt,
    keywords: post.tags.join(', '),
    author: profile ? { '@type': 'Person', name: profile.name } : undefined,
  };

  return (
    <Layout fullPage>
      <SEO
        title={`${t(post.title)} — ${profile?.name ?? 'hithuc'}`}
        description={t(post.excerpt)}
        image={post.cover}
        type="article"
        structuredData={structuredData}
      />

      <article className="max-w-2xl mx-auto">
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">
          {t(UI_TEXT.backToBlog)}
        </Link>

        <header className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">{formatDate(post.publishedAt, lang)}</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-foreground">
            {t(post.title)}
          </h1>
        </header>

        {post.cover && (
          <img
            src={post.cover}
            alt={t(post.title)}
            className="mt-6 w-full h-auto rounded-sm"
            loading="eager"
          />
        )}

        <div className="mt-8">
          <Markdown>{t(post.body)}</Markdown>
        </div>
      </article>
    </Layout>
  );
}
