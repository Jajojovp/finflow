import React, { useEffect, useState } from 'react';
import { useIsMobile, useMediaQuery } from '../../hooks/useMediaQuery';
import FadeIn from '../animations/FadeIn';
import AnimatedHeading from '../animations/AnimatedHeading';
import TextRollButton from './TextRollButton';

const HERO_STATS = [
  { value: '20+', label: 'Financial KPIs' },
  { value: '< 2 min', label: 'From upload to insight' },
  { value: '95%', label: 'Forecast accuracy' },
];

/**
 * Hero — full-screen VEX-style hero with the FinFlow market video.
 *
 * Content sits bottom-left over the looping video with a directional gradient
 * for legibility. The headline animates character by character,
 * followed by a staggered fade-in of the badge, subheading, CTAs and stats.
 * Reduced-motion users receive the same layout over the solid fallback.
 *
 * @returns {import('react').ReactElement}
 */
export default function Hero() {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isMobile = useIsMobile();
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const connection = navigator.connection;
    const slowConnection = connection?.saveData
      || ['slow-2g', '2g'].includes(connection?.effectiveType);

    if (slowConnection) return undefined;

    const loadVideo = () => setVideoReady(true);
    let idleId;
    let timeoutId;

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(loadVideo, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(loadVideo, 1200);
    }

    return () => {
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [reducedMotion]);

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-end overflow-hidden bg-bg">
      <img
        src="/images/hero-poster.svg"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {videoReady && !videoFailed && !isMobile && (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/images/hero-poster.svg"
          preload="metadata"
          aria-hidden="true"
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
      )}

      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.78)_0%,rgba(5,5,5,0.42)_45%,rgba(5,5,5,0.08)_100%),linear-gradient(0deg,rgba(5,5,5,0.92)_0%,rgba(5,5,5,0.2)_56%,rgba(5,5,5,0.08)_100%)]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-6xl mx-auto px-6 pb-10 sm:pb-16">
        <FadeIn delay={800} duration={1000}>
          <div className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-text-muted inline-flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft"
              aria-hidden="true"
            />
            AI-powered financial intelligence
          </div>
        </FadeIn>

        <AnimatedHeading
          text={['Turn raw data into', 'confident financial decisions']}
          className="font-display font-extrabold tracking-tight text-text text-4xl sm:text-5xl lg:text-7xl leading-[1.05] max-w-4xl mt-6"
          charDelay={30}
          startDelay={200}
        />

        <FadeIn
          as="p"
          delay={1200}
          duration={1000}
          className="mt-6 text-text-muted text-base sm:text-lg max-w-xl"
        >
          FinFlow unifies KPI calculation, cash-flow analysis, forecasting,
          anomaly detection and an autonomous agent — so your team moves from
          numbers to action in minutes.
        </FadeIn>

        <FadeIn delay={1400} duration={1000} className="mt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <TextRollButton variant="primary" href="/dashboard">
              Open the app
            </TextRollButton>
            <TextRollButton variant="glass" href="#features">
              See how it works
            </TextRollButton>
          </div>
          <p className="mt-4 text-xs text-text-dim">
            No credit card required · Free during beta
          </p>
        </FadeIn>

        <FadeIn
          delay={1600}
          duration={1000}
          className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6"
        >
          {HERO_STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && (
                <span
                  className="hidden sm:block h-8 w-px bg-border"
                  aria-hidden="true"
                />
              )}
              <div>
                <div className="font-mono text-xl lg:text-2xl font-semibold text-text">
                  {stat.value}
                </div>
                <div className="text-xs text-text-dim">{stat.label}</div>
              </div>
            </React.Fragment>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
