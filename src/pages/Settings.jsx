import React, { useState } from 'react';
import { Bell, Bot, Database, Shield } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import PageContainer from '../components/layout/PageContainer';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { useIsMobile } from '../hooks/useMediaQuery';
import { COMPANY_PROFILE } from '../data/datasets';

export default function Settings() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(COMPANY_PROFILE);
  const [notifications, setNotifications] = useState({
    anomalyEmail: true,
    covenantBreaches: true,
    forecastRisks: false,
    weeklyDigest: true,
  });

  const toggle = (key) => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-bg flex">
      {!isMobile && <Sidebar />}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative"><Sidebar onNavigate={() => setSidebarOpen(false)} /></div>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <PageContainer title="Settings" description="Company profile, notifications and agent configuration.">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Company profile" subtitle="Used in reports and benchmarks" />
              <div className="space-y-4">
                <Input
                  label="Company name"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
                <Input
                  label="Industry"
                  value={profile.industry}
                  onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Currency"
                    value={profile.currency}
                    onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value }))}
                  />
                  <Input
                    label="Reporting frequency"
                    value={profile.reportingFrequency}
                    onChange={(e) => setProfile((p) => ({ ...p, reportingFrequency: e.target.value }))}
                  />
                </div>
                <Button size="sm">Save profile</Button>
              </div>
            </Card>

            <Card>
              <CardHeader title="Notifications" subtitle="Choose what reaches your inbox" action={<Bell size={18} className="text-text-muted" />} />
              <ul className="space-y-3">
                {[
                  { key: 'anomalyEmail', label: 'Anomaly alerts', desc: 'Email when metrics deviate beyond thresholds.' },
                  { key: 'covenantBreaches', label: 'Covenant breaches', desc: 'Immediate alert on covenant violations.' },
                  { key: 'forecastRisks', label: 'Forecast risks', desc: 'Notify when forecast confidence drops.' },
                  { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Summary of KPIs, variances and agent actions.' },
                ].map((item) => (
                  <li key={item.key} className="flex items-start justify-between gap-4 py-2 border-b border-border/60 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text">{item.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications[item.key]}
                      onClick={() => toggle(item.key)}
                      className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${
                        notifications[item.key] ? 'bg-primary' : 'bg-bg-hover border border-border'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title="Agent configuration" subtitle="Autonomous decisioning scope" action={<Bot size={18} className="text-accent-light" />} />
              <p className="text-sm text-text-muted mb-4">
                Define the actions the autonomous agent is allowed to propose. All actions require human approval before execution.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Reallocate budget', 'Flag vendor for review', 'Adjust forecast assumptions', 'Trigger cash sweep'].map((cap) => (
                  <Badge key={cap} tone="accent">{cap}</Badge>
                ))}
              </div>
              <div className="mt-4">
                <Button size="sm" variant="outline">Edit capabilities</Button>
              </div>
            </Card>

            <Card>
              <CardHeader title="Data & security" subtitle="Connectors and access" action={<Shield size={18} className="text-success-light" />} />
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text"><Database size={16} /> Accounting connector</span>
                  <Badge tone="neutral">Not connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text"><Shield size={16} /> Two-factor auth</span>
                  <Badge tone="success" dot>Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text"><Database size={16} /> Data residency</span>
                  <Badge tone="neutral">US-East</Badge>
                </div>
                <Button size="sm" variant="secondary" className="mt-2">Manage integrations</Button>
              </div>
            </Card>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}