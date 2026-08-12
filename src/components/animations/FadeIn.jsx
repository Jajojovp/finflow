import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

/**
 * FadeIn — staggered fade/slide wrapper for VEX landing sections.
 *
 * Animates `opacity: 0 → 1` and, when `from === 'up'`,
 * `translateY(16px) → translateY(0)` using a CSS transition triggered on
 * mount. Respects `prefers-reduced-motion` (renders children with no
 * transform/transition).
 *
 * @param {object} props
 * @param {keyof JSX.IntrinsicElements} [props.as='div'] Wrapper tag.
 * @param {number} [props.delay=0] Transition delay, in ms.
 * @param {number} [props.duration=1000] Transition duration, in ms.
 * @param {'up'|'none'} [props.from='up'] Initial transform direction.
 * @param {string} [props.className] Extra classes for the wrapper.
 * @param {import('react').ReactNode} [props.children] Wrapped content.
 * @returns {import('react').ReactElement}
 */
export default function FadeIn({
  as = 'div',
  delay = 0,
  duration = 1000,
  from = 'up',
  className,
  children,
}) {
  const Tag = as;

  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const [visible, setVisible] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return undefined;
    // Defer to the next frame so the initial (hidden) state is painted
    // before the transition kicks in.
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [reducedMotion, delay]);

  const initialTransform = from === 'up' ? 'translateY(16px)' : 'translateY(0)';
  const finalTransform = 'translateY(0)';

  const style = reducedMotion
    ? undefined
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? finalTransform : initialTransform,
         transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
        willChange: 'opacity, transform',
      };

  return (
    <Tag className={clsx(className)} style={style}>
      {children}
    </Tag>
  );
}
