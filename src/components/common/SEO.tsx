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
  description = "Official portfolio of Alinur Sekh (Authorized LIC Advisor, License: 16541-41A) and SK ONLINE CSP Banking Hub. Dual bank CSP for Bank of India & Bank of Baroda, GST/ITR filing, and CSC digital services in Rampur Bazar, Sandeshkhali.",
  keywords = "SK Online, Alinur Sekh, LIC Agent Sandeshkhali, Bank of India CSP Rampur, Bank of Baroda CSP, CSC Center North 24 Parganas, GST Filing, ITR Filing, PVC Card Print, Train Ticket Booking",
  ogType = "website",
  ogImage = "https://skonline.in.net/og-banner.png",
  schema,
}: SeoProps) {
  // If the passed title already contains SK ONLINE, use it directly.
  // Otherwise, append the brand name to distinguish page context.
  const fullTitle = title.includes("SK ONLINE") ? title : `${title} | SK ONLINE`;

  // Dynamically build the canonical URL based on current routing path
  const canonicalUrl = `https://skonline.in.net${
    window.location.pathname.endsWith("/") && window.location.pathname !== "/"
      ? window.location.pathname.slice(0, -1)
      : window.location.pathname
  }`;

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="SK ONLINE" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
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
