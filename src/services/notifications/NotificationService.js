/**
 * NotificationService — subscribes to EventBus events and dispatches
 * notifications via configured channels (in-memory, email stub, etc.).
 *
 * Channels are pluggable: any object implementing `send({ to, subject, body })`
 * can be registered. The default channel is an in-memory queue.
 */

import EventBus from '../core/EventBus';

const LEVELS = { info: 'info', warning: 'warning', critical: 'critical' };

class NotificationServiceClass {
  constructor() {
    this._channels = [];
    this._queue = [];
    this._subscribed = false;
    this._subscriptions = [];
  }

  /** Register a delivery channel. */
  addChannel(channel) {
    if (channel && typeof channel.send === 'function') {
      this._channels.push(channel);
    }
    return () => {
      this._channels = this._channels.filter((c) => c !== channel);
    };
  }

  /** Begin listening to relevant events. */
  start() {
    if (this._subscribed) return;
    this._subscriptions.push(
      EventBus.on('covenant.breach', (payload) =>
        this.notify({ level: LEVELS.critical, topic: 'Covenant breach', body: payload }),
      ),
      EventBus.on('anomaly.detected', (payload) =>
        this.notify({ level: LEVELS.warning, topic: 'Anomaly detected', body: payload }),
      ),
      EventBus.on('agent.proposed', (payload) =>
        this.notify({ level: LEVELS.info, topic: 'Agent proposed actions', body: payload }),
      ),
      EventBus.on('agent.approved', (payload) =>
        this.notify({ level: LEVELS.info, topic: 'Agent action approved', body: payload }),
      ),
    );
    this._subscribed = true;
  }

  stop() {
    this._subscriptions.forEach((off) => off && off());
    this._subscriptions = [];
    this._subscribed = false;
  }

  /** Emit a notification to all channels and keep it in the in-memory queue. */
  notify(notification) {
    const record = {
      id: `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      level: notification.level || LEVELS.info,
      topic: notification.topic,
      body: notification.body,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this._queue = [record, ...this._queue].slice(0, 100);
    for (const channel of this._channels) {
      try {
        channel.send(record);
      } catch (err) {
        console.error('[NotificationService] channel error:', err);
      }
    }
    return record;
  }

  list() {
    return this._queue;
  }

  unreadCount() {
    return this._queue.filter((n) => !n.read).length;
  }

  markRead(id) {
    this._queue = this._queue.map((n) => (n.id === id ? { ...n, read: true } : n));
  }

  clear() {
    this._queue = [];
  }
}

export const NotificationService = new NotificationServiceClass();
export default NotificationService;