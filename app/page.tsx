import { PublicationObservatory } from "./components/publication-observatory";
import { portfolioData } from "./data/portfolio-content";

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export default function Home() {
  return (
    <main>
      <header className="site-header" id="top">
        <a className="wordmark" href="#top" aria-label="Wen Sheng Lim, home">
          <span>WS</span>
          Wen Sheng Lim
        </a>
        <p className="header-role">
          PhD candidate · National Taiwan University (NTU), Taiwan
        </p>
        <nav aria-label="Profile links">
          <a href="https://scholar.google.com/citations?user=y_7M9psAAAAJ">
            Scholar <ArrowIcon />
          </a>
          <a href="https://github.com/tundergod">
            GitHub <ArrowIcon />
          </a>
          <a href="mailto:tundergod1882@gmail.com">
            Contact <ArrowIcon />
          </a>
        </nav>
      </header>

      <section className="profile-intro" aria-labelledby="profile-name">
        <h1 className="sr-only" id="profile-name">Wen Sheng Lim</h1>
        <p>
          Wen Sheng Lim is a PhD candidate in Computer Science and Information
          Engineering at National Taiwan University. His research spans memory
          and storage systems, embedded computing, and efficient systems under
          resource constraints. He expects to graduate in January 2027.
        </p>
      </section>

      <section className="publications-section" id="publications">
        <PublicationObservatory data={portfolioData} />
      </section>

      <footer className="compact-footer">
        <span>Wen Sheng Lim · Taipei, Taiwan</span>
        <div className="footer-links">
          <a href="mailto:tundergod1882@gmail.com">Email <ArrowIcon /></a>
          <a href="https://www.linkedin.com/in/tundergod">LinkedIn <ArrowIcon /></a>
          <a href="https://orcid.org/0000-0002-2391-8127">ORCID <ArrowIcon /></a>
        </div>
      </footer>
    </main>
  );
}
