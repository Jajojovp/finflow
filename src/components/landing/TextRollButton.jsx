import React from 'react';
import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * TextRollButton — CTA link with an Axion Studio-style text-roll hover.
 *
 * On hover the button label rolls upward, revealing a duplicate copy of the
 * same text, while the trailing icon rotates -45deg. Both the duplicated
 * labels and the icon animate with a 500ms cubic-bezier ease.
 *
 * @param {object} props
 * @param {'primary'|'glass'} [props.variant='primary'] Primary = gold fill
 *   with black text (WCAG AA). Glass = liquid-glass pill with light text.
 * @param {string} props.href Destination URL. Internal paths use React Router
 *   `Link`; anchors and external URLs use an `<a>`.
 * @param {import('react').ReactNode} [props.children] Button label.
 * @param {string} [props.className] Extra classes applied to the `<a>`.
 * @param {import('react').ReactNode} [props.icon] Icon rendered after the
 *   label. Defaults to `lucide-react` `ArrowRight`.
 * @param {boolean} [props.external] When `true` the link opens in a new tab
 *   with `rel="noopener noreferrer"`.
 * @returns {import('react').ReactElement}
 */
export default function TextRollButton({
  variant = 'primary',
  href,
  children,
  className,
  icon,
  external = false,
}) {
  const Icon = icon || ArrowRight;

  const variantClasses =
    variant === 'glass'
      ? 'liquid-glass rounded-lg px-5 py-3 text-text font-medium'
      : 'bg-primary text-black font-semibold rounded-lg px-5 py-3 shadow-glow-primary transition-shadow hover:shadow-glow-primary/40';

  const linkProps = {
    className: clsx(
      'group inline-flex min-h-11 items-center gap-3 whitespace-nowrap',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
      variantClasses,
      className,
    ),
  };

  const content = (
    <>
      <span className="relative overflow-hidden h-[20px]">
        <span className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-y-[-50%]">
          <span className="h-[20px] leading-[20px]">{children}</span>
          <span className="h-[20px] leading-[20px]" aria-hidden="true">{children}</span>
        </span>
      </span>
      <Icon
        size={16}
        aria-hidden="true"
        className="shrink-0 transition-transform duration-500 group-hover:rotate-[-45deg]"
      />
    </>
  );

  if (href?.startsWith('/') && !external) {
    return <Link to={href} {...linkProps}>{content}</Link>;
  }

  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...linkProps}
    >
      {content}
    </a>
  );
}
