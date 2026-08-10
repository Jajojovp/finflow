/**
 * useAgentManager — React hook that wraps AgentOrchestrator with state,
 * approval flow and EventBus notifications. All actions require explicit
 * human approval before being marked as 'approved'.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import AgentOrchestrator, { CAPABILITIES } from './AgentOrchestrator';
import EventBus from '../core/EventBus';

const ALL_CAPABILITIES = Object.values(CAPABILITIES);

export function useAgentManager({ series, covenants = [], capabilities = ALL_CAPABILITIES, autoRun = false } = {}) {
  const [actions, setActions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [running, setRunning] = useState(false);
  const [lastRunAt, setLastRunAt] = useState(null);

  const run = useCallback(() => {
    setRunning(true);
    try {
      const result = AgentOrchestrator.propose({ series, covenants, capabilities });
      setActions(result.actions);
      setSummary(result.summary);
      setLastRunAt(new Date().toISOString());
      EventBus.emit('agent.run', { count: result.actions.length });
    } finally {
      setRunning(false);
    }
  }, [series, covenants, capabilities]);

  const approve = useCallback((actionId) => {
    setActions((prev) => {
      const next = prev.map((a) =>
        a.id === actionId ? { ...a, status: 'approved', approvedAt: new Date().toISOString() } : a,
      );
      const approved = next.find((a) => a.id === actionId);
      if (approved) EventBus.emit('agent.approved', approved);
      return next;
    });
  }, []);

  const reject = useCallback((actionId) => {
    setActions((prev) => {
      const next = prev.map((a) =>
        a.id === actionId ? { ...a, status: 'rejected', rejectedAt: new Date().toISOString() } : a,
      );
      const rejected = next.find((a) => a.id === actionId);
      if (rejected) EventBus.emit('agent.rejected', rejected);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setActions([]);
    setSummary(null);
  }, []);

  useEffect(() => {
    if (autoRun && series?.length) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const pending = useMemo(() => actions.filter((a) => a.status === 'proposed'), [actions]);
  const approved = useMemo(() => actions.filter((a) => a.status === 'approved'), [actions]);

  return {
    actions,
    pending,
    approved,
    summary,
    running,
    lastRunAt,
    run,
    approve,
    reject,
    clear,
  };
}

export default useAgentManager;