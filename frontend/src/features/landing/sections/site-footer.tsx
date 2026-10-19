import { Link } from 'react-router-dom';
import { Container } from '../components/container';
import { Wordmark } from '../components/wordmark';
import { FOOTER_COPY, LEGAL_LINKS, PRODUCT_LINKS } from '../data/final-cta';

export function SiteFooter() {
  return (
    <footer id="site-footer" className="l-footer">
      <Container>
        <div className="l-footer-grid">
          <div className="l-footer-brand">
            <Wordmark size={22} on="dark" />
            <p className="l-footer-line">{FOOTER_COPY.line}</p>
          </div>
          <nav className="l-footer-col" aria-label={FOOTER_COPY.productTitle}>
            <p className="l-footer-title">{FOOTER_COPY.productTitle}</p>
            <ul className="l-footer-links">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link to={link.to} className="l-footer-link">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="l-footer-link">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          {LEGAL_LINKS.length > 0 ? (
            <nav className="l-footer-col" aria-label={FOOTER_COPY.legalTitle}>
              <p className="l-footer-title">{FOOTER_COPY.legalTitle}</p>
              <ul className="l-footer-links">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className="l-footer-link">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="l-footer-link">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
        <div className="l-footer-bottom">
          <p>{FOOTER_COPY.copyright}</p>
          <p>{FOOTER_COPY.disclaimer}</p>
        </div>
      </Container>
    </footer>
  );
}
