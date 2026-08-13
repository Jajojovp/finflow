import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Landing from './pages/Landing';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analysis = lazy(() => import('./pages/Analysis'));
const Forecast = lazy(() => import('./pages/Forecast'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function LoadingFallback() {
  return (
    <output className="min-h-screen bg-bg flex items-center justify-center" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </output>
  );
}

export default function App() {
  return (
    <DataProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-black focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to content
      </a>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/dashboard"
              element={
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              }
            />
            <Route
              path="/analysis"
              element={
                <ErrorBoundary>
                  <Analysis />
                </ErrorBoundary>
              }
            />
            <Route
              path="/forecast"
              element={
                <ErrorBoundary>
                  <Forecast />
                </ErrorBoundary>
              }
            />
            <Route
              path="/settings"
              element={
                <ErrorBoundary>
                  <Settings />
                </ErrorBoundary>
              }
            />
            <Route
              path="*"
              element={
                <ErrorBoundary>
                  <NotFound />
                </ErrorBoundary>
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </DataProvider>
  );
}
