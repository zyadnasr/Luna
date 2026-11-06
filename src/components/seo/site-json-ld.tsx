import { getSiteUrl } from "@/lib/seo";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FoodEstablishment",
      "@id": `${siteUrl}/#business`,
      name: "Luna Healthy",
      url: siteUrl,
      logo: `${siteUrl}/assets/logo-circule.png`,
      image: `${siteUrl}/assets/hero.jpg`,
      description:
        "Healthy cookies and desserts prepared with carefully selected ingredients and delivered across Cairo.",
      servesCuisine: ["Healthy food", "Desserts"],
      areaServed: {
        "@type": "City",
        name: "Cairo",
        containedInPlace: { "@type": "Country", name: "Egypt" },
      },
      priceRange: "$$",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Luna Healthy",
      url: siteUrl,
      publisher: { "@id": `${siteUrl}/#business` },
      inLanguage: ["ar-EG", "en", "it"],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
