import { PublicationObservatory } from "./components/publication-observatory";
import { portfolioData } from "./data/portfolio-content";

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export default function Home() {
  const { bio, links } = portfolioData;
  const headerLinks = links.filter(({ placement }) => placement === "header");
  const footerLinks = links.filter(({ placement }) => placement === "footer");
  const headerRole = `${bio.role} · ${bio.affiliation}, ${bio.affiliationCountry}`;

  return (
    <main>
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
