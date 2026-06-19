import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { usePortfolio } from '@/context/PortfolioContext';
import { useT } from '@/context/LanguageContext';
import { AboutPageLayout } from '@/components/about/AboutPageLayout';
import { SEO } from '@/components/seo/SEO';
import { UI_TEXT } from '@/lib/labels';

export default function About() {
  const { profile, loading, error } = usePortfolio();
  const t = useT();

  const structuredData = profile
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        description: t(profile.tagline),
        email: profile.contact.email,
        url: typeof window !== 'undefined' ? window.location.origin : undefined,
        image: profile.avatar,
        sameAs: profile.socials.map((s) => s.url),
      }
    : undefined;

  useEffect(() => {
    if (profile) document.title = `${t(UI_TEXT.about)} — ${profile.name}`;
  }, [profile, t]);

  if (loading) {
    return (
      <Layout fullPage>
        <SEO title="About — Loading…" description="Loading profile" />
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent" />
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout fullPage>
        <SEO title="About — Error" description="Error loading profile" />
        <p className="text-destructive font-semibold">{t(UI_TEXT.loadError)}</p>
      </Layout>
    );
  }

  return (
    <Layout fullPage>
      <SEO
        title={`${t(UI_TEXT.about)} — ${profile.name}`}
        description={t(profile.tagline)}
        image={profile.avatar}
        type="profile"
        structuredData={structuredData}
      />
      <AboutPageLayout profile={profile} />
    </Layout>
  );
}
