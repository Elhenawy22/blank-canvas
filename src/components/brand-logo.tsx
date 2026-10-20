import ReachLogo from "./reach-logo";

/**
 * Brand lockup. The logo artwork is brand identity — it is intentionally
 * identical in both locales. The accessible label is localized. The purple
 * plate is part of the site chrome (not the asset) so the original white
 * lettering keeps its contrast on the light header and footer.
 */
export function BrandLogo({
  ariaLabel = "Reach Agency home",
  homeHref = "#home",
}: {
  ariaLabel?: string;
  homeHref?: string;
}) {
  return (
    <a className="brand" href={homeHref} aria-label={ariaLabel}>
      <span className="brand__plate" aria-hidden="true">
        <ReachLogo decorative />
      </span>
    </a>
  );
}
