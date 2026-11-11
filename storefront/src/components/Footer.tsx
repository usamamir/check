import { Link } from "react-router-dom";
import logoUrl from "@assets/logo/jettribe-mark.png";
import { footerColumns } from "@/data/menu";
import { meta } from "@/data/products";
import "@/styles/footer.css";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid container">
        {footerColumns.map((col) => (
          <div key={col.heading}>
            <h3>{col.heading}</h3>
            <ul>
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link to={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3>Contact</h3>
          <p>
            <a href={`tel:${meta.contact.phone}`}>{meta.contact.phone}</a>
            <br />
            <a href={`mailto:${meta.contact.email}`}>{meta.contact.email}</a>
            <br />
            {meta.contact.hours}
          </p>
          <div className="socials" aria-label="Social links">
            <a href="https://www.instagram.com/jettribe/" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://www.facebook.com/jettribe/" target="_blank" rel="noreferrer">
              Facebook
            </a>
            <a href="https://www.youtube.com/@jettribe" target="_blank" rel="noreferrer">
              YouTube
            </a>
          </div>
        </div>
      </div>
      <div className="footer-legal container">
        <img src={logoUrl} alt="Jettribe" height={24} />
        <p>© {new Date().getFullYear()} Jettribe. Born in Southern California.</p>
      </div>
    </footer>
  );
}
