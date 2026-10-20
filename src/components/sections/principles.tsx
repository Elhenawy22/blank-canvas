import RevealArea from "@/components/motion/reveal-area";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Vision & mission — two editorial rows with symbolic medallions.
 * Entrance is handled by the shared data-reveal system.
 */
export default function Principles({ dictionary }: { dictionary: Dictionary }) {
  const principles = dictionary.principles;

  return (
    <RevealArea
      as="section"
      ariaLabel={principles.aria}
      className="principles"
    >
      {principles.items.map((principle) => (
        <article className="principle" data-reveal key={principle.title}>
          <span aria-hidden="true" className="principle__symbol">
            {principle.symbol}
          </span>
          <h2>{principle.title}</h2>
          <p>{principle.copy}</p>
        </article>
      ))}
    </RevealArea>
  );
}
