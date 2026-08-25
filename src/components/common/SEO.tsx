/* eslint-disable @typescript-eslint/no-explicit-any */
import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description?: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
  schema?: Record<string, any>;
}

export default function SEO({
  title,
  description = "SK ONLINE – Bank Customer Service Point (CSP) Management Portal for secure account registration, delivery tracking and WhatsApp communication.",
  keywords = "CSP, banking, customer service point, bank of india, financial inclusion, SK ONLINE",
  ogType = "website",
  ogImage = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=630&fit=crop",
  schema,
}: SeoProps) {
  const fullTitle = `${title} | SK ONLINE – CSP Banking Portal`;

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="SK ONLINE" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Schema (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
