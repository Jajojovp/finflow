import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

/**
 * AnimatedHeading — Hero VEX heading that reveals text character by character.
 *
 * Each character animates from `opacity: 0` + `translateX(-18px)` to
 * `opacity: 1` + `translateX(0)` with a stagger computed as:
 *
 *   delay = startDelay + lineIndex * lineLength * charDelay + charIndex * charDelay
 *
 * Spaces are rendered as a non-breaking space (`\u00A0`) so the animated
 * inline characters keep their visual width and the line doesn't collapse
 * while the animation is in progress.
 *
 * Respects `prefers-reduced-motion`: when the user opts out of motion the
 * heading renders plain text with no transitions.
 *
 * @param {object} props
 * @param {string|string[]} props.text Heading text. Pass an array to render
 *   multiple lines (each entry becomes its own block line).
 * @param {keyof JSX.IntrinsicElements} [props.as='h1'] Wrapper tag.
 * @param {string} [props.className] Classes applied to the wrapper element.
 * @param {string} [props.charClassName] Classes applied to each character span.
 * @param {number} [props.charDelay=30] Stagger between characters, in ms.
 * @param {number} [props.startDelay=200] Delay before the first char animates, in ms.
 * @param {number} [props.duration=500] Per-character transition duration, in ms.
 * @returns {import('react').ReactElement}
 */
export default function AnimatedHeading({
  text,
  as = 'h1',
  className,
  charClassName = '',
  charDelay = 30,
  startDelay = 200,
  duration = 500,
}) {
  const Tag = as;

  // Normalise to an array of lines so the rendering logic is uniform.
  const lines = useMemo(
    () => (Array.isArray(text) ? text : [text ?? '']),
    [text],
  );

  // Detect prefers-reduced-motion once on mount (SSR-safe: window may be
  // undefined in non-browser environments, hence the optional chaining).
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  // Start on the next frame; the complete delay is encoded once in each
  // character's transitionDelay below.
  const [started, setStarted] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const frame = requestAnimationFrame(() => setStarted(true));
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  // Fast path for reduced-motion: render the text with no animation wrappers.
  if (reducedMotion) {
    return (
      <Tag className={clsx(className)}>
        {lines.map((line, i) => (
          <React.Fragment key={`rm-line-${i}`}>
            {i > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={clsx(className)} aria-label={lines.join(' ')}>
      {lines.map((line, lineIndex) => (
        <span key={`line-${lineIndex}`} className="block" aria-hidden="true">
          {Array.from(line).map((ch, charIndex) => {
            const delay =
              startDelay +
              lineIndex * line.length * charDelay +
              charIndex * charDelay;

            return (
              <span
                key={`char-${lineIndex}-${charIndex}`}
                className={clsx('inline-block will-change-transform', charClassName)}
                style={{
                  opacity: started ? 1 : 0,
                  transform: started ? 'translateX(0)' : 'translateX(-18px)',
                  transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
                  transitionDelay: `${delay}ms`,
                }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
