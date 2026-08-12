import React from 'react';
import clsx from 'clsx';

const SIZES = {
  sm: { box: 24, text: 'text-sm' },
  md: { box: 32, text: 'text-base' },
  lg: { box: 40, text: 'text-lg' },
};

/**
 * Logo — FinFlow brand mark (gold diamond) with optional wordmark.
 *
 * The mark is a rounded square on the dark surface with a rotated gold
 * gradient diamond inside, echoing the app favicon. The wordmark renders
 * "Fin" in the light text tone and "Flow" in primary (gold).
 *
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md'] Render size: `sm` = 24px,
 *   `md` = 32px, `lg` = 40px. The wordmark scales to match.
 * @param {boolean} [props.showText=true] Whether to render the "FinFlow"
 *   wordmark next to the mark. Set `false` for icon-only contexts (e.g.
 *   collapsed sidebar, tight spots).
 * @param {string} [props.className] Extra classes applied to the wrapper.
 * @returns {import('react').ReactElement}
 */
export function Logo({ size = 'md', showText = true, className }) {
  const { box, text } = SIZES[size] || SIZES.md;

  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <span
        className="relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-lg bg-bg-surface border border-border shadow-card"
        style={{ width: box, height: box }}
        aria-hidden="true"
      >
        <span className="block w-1/2 h-1/2 rotate-45 rounded-[2px] bg-gradient-to-br from-primary-light to-primary-dark shadow-glow-primary" />
        <span className="absolute top-[14%] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rotate-45 bg-white/70" />
      </span>
      {showText && (
        <span className={clsx('font-display font-semibold tracking-tight leading-none', text)}>
          <span className="text-text">Fin</span>
          <span className="text-primary">Flow</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
