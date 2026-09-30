/**
 * The closing line at the foot of every page.
 *
 * Deliberately minimal: just the copyright. The social links were removed -
 * a link out to the source repository is a development affordance, not
 * something to put in front of users of a hosted product.
 *
 * The AI caveat lives in the retention popover on the datasets page, where
 * it sits next to the numbers a user is about to act on, rather than being
 * repeated in every footer.
 */
export default function Footer() {
  return (
    <footer className="site-footer">
      <p className="site-footer-copy">© Satish-Labs</p>
    </footer>
  )
}
