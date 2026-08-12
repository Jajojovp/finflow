import React from 'react';
import FadeIn from '../animations/FadeIn';
import TextRollButton from './TextRollButton';

/**
 * CTA — Dark Luxe closing call-to-action.
 *
 * A rounded gold-tinted card with the real FinFlow pitch, primary "Get
 * started free" action and a secondary glass link into the forecast demo.
 *
 * @returns {import('react').ReactElement}
 */
export default function CTA() {
  return (
    <section aria-labelledby="cta-title" className="bg-bg py-24 lg:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <FadeIn duration={1000}>
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-bg-surface to-bg-surface p-8 sm:p-10 lg:p-16 text-center shadow-glow-primary/30">
            <h2 id="cta-title" className="font-display font-extrabold text-text text-3xl sm:text-4xl">
              Start making confident financial decisions
            </h2>
            <p className="mt-4 text-text-muted max-w-xl mx-auto">
              Join the FinFlow beta and replace spreadsheet chaos with one source of truth.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <TextRollButton variant="primary" href="/dashboard">
                Get started free
              </TextRollButton>
              <TextRollButton variant="glass" href="/forecast">
                See forecasting
              </TextRollButton>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
