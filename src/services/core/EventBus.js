/**
 * EventBus — lightweight pub/sub used by services that must communicate
 * without direct coupling (e.g. anomaly detection -> notifications).
 *
 * Usage:
 *   EventBus.on('covenant.breach', handler);
 *   EventBus.emit('covenant.breach', { id, metric });
 *   EventBus.off('covenant.breach', handler);
 */

class EventBusClass {
  constructor() {
    this._handlers = new Map();
  }

  on(event, handler) {
    if (typeof handler !== 'function') return () => {};
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event).add(handler);
    return () => this.off(event, handler);
  }

  once(event, handler) {
    if (typeof handler !== 'function') return () => {};
    const wrapped = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped);
  }

  off(event, handler) {
    const set = this._handlers.get(event);
    if (!set) return;
    if (handler) set.delete(handler);
    else set.clear();
  }

  emit(event, payload) {
    const set = this._handlers.get(event);
    if (!set || set.size === 0) return;
    for (const handler of set) {
      try {
        handler(payload);
      } catch (err) {
        // Never let one handler break the bus.
        // eslint-disable-next-line no-console
        console.error(`[EventBus] handler error for "${event}":`, err);
      }
    }
  }

  clear() {
    this._handlers.clear();
  }

  listenerCount(event) {
    return this._handlers.get(event)?.size || 0;
  }
}

export const EventBus = new EventBusClass();
export default EventBus;