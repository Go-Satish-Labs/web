/**
 * Site footer with the brand mark and social links.
 *
 * The icons come from /icons.svg as a sprite via <use>, so the file is
 * requested once and cached rather than six times.
 *
 * Only destinations that actually exist are rendered. Adding a link here
 * needs a real URL - a guessed handle is a dead link in a footer, which is
 * the most visible place in the product to ship one.
 */
import Logo from './Logo'

interface SocialLink {
  /** Symbol id inside /public/icons.svg */
  icon: string
  label: string
  href: string
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    icon: 'github-icon',
    label: 'GitHub',
    href: 'https://github.com/Go-Satish-Labs/web',
  },
  // Add the rest as these accounts exist, e.g.:
  // { icon: 'discord-icon',  label: 'Discord',  href: 'https://discord.gg/...' },
  // { icon: 'bluesky-icon',  label: 'Bluesky',  href: 'https://bsky.app/profile/...' },
  // { icon: 'x-icon',        label: 'X',       href: 'https://x.com/...' },
]

/** The social row on its own, so a page can place it in its own chrome. */
export function SocialLinks() {
  return (
    <nav className="site-footer-links" aria-label="Social links">
      {SOCIAL_LINKS.map(link => (
        <a
          key={link.label}
          href={link.href}
          // These go somewhere new, so open in a new tab without leaking
          // the referring URL.
          target="_blank"
          rel="noopener noreferrer"
          title={link.label}
          aria-label={link.label}
        >
          <svg width="16" height="16" aria-hidden="true">
            <use href={`/icons.svg#${link.icon}`} />
          </svg>
        </a>
      ))}
    </nav>
  )
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Logo size={22} />
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0a0a0a' }}>Analytrix</span>
        </div>
        <SocialLinks />
      </div>
      <p className="site-footer-note">
        Numbers are calculated from your file. Files are deleted automatically — see the
        retention notice on your datasets page.
      </p>
    </footer>
  )
}
