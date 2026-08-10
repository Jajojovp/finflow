import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

export default function CTA() {
  return (
    <section className="bg-bg py-20 sm:py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-10 sm:p-14 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />
          <div className="relative">
            <h2 className="font-display font-extrabold text-white text-3xl sm:text-4xl">
              Start making confident financial decisions
            </h2>
            <p className="mt-4 text-white/90 max-w-xl mx-auto">
              Join the FinFlow beta and replace spreadsheet chaos with one source of truth.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/dashboard">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Get started free
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/forecast">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/10">
                  See forecasting
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}