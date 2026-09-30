/**
 * The closing box at the foot of every page.
 *
 * Carries the two things a user needs to know before leaving: that the app
 * can be wrong, and who built it. The AI disclaimer is stated plainly because
 * the product does generate explanations, and a number nobody checks is a
 * number nobody should act on.
 *
 * The social icons come from /icons.svg as a sprite via <use>, so the file is
 * requested once and cached rather than once per icon.
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
  if (SOCIAL_LINKS.length === 0) return null
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
      <div className="site-footer-card">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <Logo size={20} />
            <span className="site-footer-name">Analytrix</span>
          </div>
          <SocialLinks />
        </div>

        <p className="site-footer-ai">
          <strong>AI can make mistakes.</strong> Every number is calculated from your
          file, but check anything important before acting on it.
        </p>

        <p className="site-footer-copy">© Satish-Labs</p>
      </div>
    </footer>
  )
}
