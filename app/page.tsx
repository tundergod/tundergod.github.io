import { PublicationObservatory } from "./components/publication-observatory";
import { portfolioData } from "./data/portfolio-content";
import type { PortfolioData } from "./data/portfolio-schema";
import { CANONICAL_URL } from "./lib/site";

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function buildStructuredData(data: PortfolioData) {
  const { bio, links, publications } = data;
  const sameAs = links
    .filter((link) => link.url.startsWith("https://"))
    .map((link) => link.url);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: bio.name,
        jobTitle: bio.role,
        affiliation: {
          "@type": "Organization",
          name: bio.affiliation,
        },
        url: CANONICAL_URL,
        sameAs,
      },
      ...publications.map((publication) => ({
        "@type": "ScholarlyArticle",
        headline: publication.title,
        author: publication.authors.map((name) => ({
          "@type": "Person",
          name,
        })),
        datePublished: String(publication.year),
        ...(publication.doi
          ? { identifier: `https://doi.org/${publication.doi}` }
          : {}),
      })),
    ],
  };
}

export default function Home() {
  const { bio, links } = portfolioData;
  const headerLinks = links.filter(({ placement }) => placement === "header");
  const footerLinks = links.filter(({ placement }) => placement === "footer");
  const headerRole = `${bio.role} · ${bio.affiliation}, ${bio.affiliationCountry}`;
  const structuredData = buildStructuredData(portfolioData);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <header className="site-header" id="top">
        <a className="wordmark" href="#top" aria-label={`${bio.name}, home`}>
          <span>{bio.monogram}</span>
          {bio.name}
        </a>
        <p className="header-role">{headerRole}</p>
        <nav aria-label="Profile links">
          {headerLinks.map((link) => (
            <a href={link.url} key={link.id}>
              {link.label} <ArrowIcon />
            </a>
          ))}
        </nav>
      </header>

      <section className="profile-intro" aria-labelledby="profile-name">
        <h1 className="sr-only" id="profile-name">{bio.name}</h1>
        <p>{bio.biography}</p>
      </section>

      <section className="publications-section" id="publications">
        <PublicationObservatory data={portfolioData} />
      </section>

      <footer className="compact-footer">
        <span>{bio.name} · {bio.location}</span>
        <div className="footer-links">
          {footerLinks.map((link) => (
            <a href={link.url} key={link.id}>
              {link.label} <ArrowIcon />
            </a>
          ))}
        </div>
      </footer>
    </main>
  );
}
