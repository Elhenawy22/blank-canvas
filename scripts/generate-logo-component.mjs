import { readFile, writeFile } from "node:fs/promises";
const svg = await readFile("public/brand/reach-logo.svg", "utf8");
const ds = [...svg.matchAll(/<path d="([^"]+)"\/>/g)].map((m) => m[1]);
if (ds.length !== 2) throw new Error(`Expected 2 paths, got ${ds.length}`);
const [white, yellow] = ds;
const out = `import type { SVGProps } from "react";

/**
 * REACH logo — traced from the supplied artwork (not redrawn).
 *
 * Two layers are preserved so the preloader can animate the yellow arrow
 * independently while the white lettering and boxes stay pin-sharp.
 * The SVG geometry matches public/brand/reach-logo.svg.
 */
export default function ReachLogo({
  className,
  decorative = false,
  title = "Reach",
  ...rest
}: {
  className?: string;
  decorative?: boolean;
  title?: string;
} & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 1658 932"
      width="1658"
      height="932"
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <g className="reach-logo__white" data-reach-white="" fill="#ffffff" fillRule="evenodd">
        <path d=${JSON.stringify(white)} />
      </g>
      <g className="reach-logo__yellow" data-reach-yellow="" fill="#ffdb00" fillRule="evenodd">
        <path d=${JSON.stringify(yellow)} />
      </g>
    </svg>
  );
}
`;
await writeFile("src/components/reach-logo.tsx", out);
console.log("wrote src/components/reach-logo.tsx", out.length, "bytes");
