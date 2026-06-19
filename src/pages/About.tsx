import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { usePortfolio } from '@/context/PortfolioContext';
import { AboutPageLayout } from '@/components/about/AboutPageLayout';
import { SEO } from '@/components/seo/SEO';

export default function About() {
  const { photographer, loading, error } = usePortfolio();

  const structuredData = photographer ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: photographer.name,
    jobTitle: 'Professional Portrait Photographer',
    description: photographer.tagline,
    email: photographer.contact.email,
    telephone: photographer.contact.phone,
    url: window.location.origin,
    image: photographer.portraitImage.src,
    knowsAbout: ['Portrait Photography', 'Documentary Photography', 'Editorial Photography'],
  } : undefined;

  // Set page title
  useEffect(() => {
    document.title = photographer 
      ? `About ${photographer.name} - Portrait Photographer`
      : 'About - Sarah Chen Photography';
  }, [photographer]);

  if (loading) {
    return (
      <Layout fullPage>
        <SEO title="About - Loading..." description="Loading photographer profile" />
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !photographer) {
    return (
      <Layout fullPage>
        <SEO title="About - Error" description="Error loading photographer profile" />
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md px-4">
            <p className="text-destructive font-semibold">Error loading profile</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {error || "Could not load photographer profile"}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullPage>
      <SEO
        title={`About ${photographer.name} - Portrait Photographer`}
        description={photographer.tagline}
        image={photographer.portraitImage.src}
        type="profile"
        structuredData={structuredData}
      />
      <AboutPageLayout photographer={photographer} />
    </Layout>
  );
}
