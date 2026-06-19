import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { usePortfolio } from "@/context/PortfolioContext";
import { FilmstripGallery } from "@/components/gallery/FilmstripGallery";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";
import { SEO } from "@/components/seo/SEO";
import NotFound from "./NotFound";

export default function SeriesPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getSeriesBySlug, photographer, loading } = usePortfolio();

  const series = slug ? getSeriesBySlug(slug) : null;

  const seoTitle = series
    ? `${series.title} - ${photographer?.name || "Portrait Photographer"}`
    : photographer?.name || "Portrait Photographer";

  const seoDescription =
    series?.description ||
    `${series?.title || "Photography"} series by ${photographer?.name || "professional photographer"}`;

  const structuredData = series
    ? {
        "@context": "https://schema.org",
        "@type": "ImageGallery",
        name: series.title,
        description: series.description,
        image: series.images.map((img) => ({
          "@type": "ImageObject",
          url: img.src,
          caption: img.caption,
        })),
      }
    : undefined;

  // Set page title and preload critical resources
  useEffect(() => {
    if (series) {
      document.title = seoTitle;
    }

    // Preconnect to image CDN for faster loading
    const preconnectLink = document.createElement("link");
    preconnectLink.rel = "preconnect";
    preconnectLink.href = "https://images.unsplash.com";

    if (!document.querySelector(`link[href="${preconnectLink.href}"]`)) {
      document.head.appendChild(preconnectLink);
    }
  }, [series, seoTitle]);

  if (loading) {
    return (
      <Layout>
        <SEO title="Loading..." description="Loading series" />
        <div className="h-full flex items-center justify-center">
          <GallerySkeleton />
        </div>
      </Layout>
    );
  }

  if (!series) {
    return <NotFound />;
  }

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={series.images[0]?.src}
        type="article"
        structuredData={structuredData}
      />
      <div className="h-full flex items-center justify-center">
        <FilmstripGallery images={series.images} />
      </div>
    </Layout>
  );
}
