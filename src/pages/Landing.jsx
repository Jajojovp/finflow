import React from 'react';
import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Metrics from '../components/landing/Metrics';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

/**
 * Landing — FinFlow marketing page composed of the Dark Luxe sections.
 *
 * @returns {import('react').ReactElement}
 */
export default function Landing() {
  return (
    <div className="bg-bg text-text min-h-screen">
      <LandingNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Metrics />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
