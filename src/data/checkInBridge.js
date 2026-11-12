/**
 * Demo bridge between the kiosk tab and the phone app (same origin).
 * After the phone links via QR, the kiosk publishes seat + pass when check-in finishes.
 */
const STORAGE_KEY = 'foco:check-in';
const CHANNEL = 'foco-check-in';

export function publishCheckIn({ seat, passHours, member = true }) {
  const payload = {
    seat,
    passHours,
    member,
    at: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
  try {
    const ch = new BroadcastChannel(CHANNEL);
    ch.postMessage(payload);
    ch.close();
  } catch {
    /* BroadcastChannel unsupported */
  }
  return payload;
}

/** Clears a published check-in so a later visit does not reuse it. */
export function clearPublishedCheckIn() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Subscribe to a kiosk check-in result. Calls `onCheckIn` once per matching payload.
 * Returns an unsubscribe function.
 */
export function subscribeCheckIn(onCheckIn) {
  const deliver = (raw) => {
    if (!raw || typeof raw !== 'object') return;
    if (!raw.seat || !raw.passHours) return;
    onCheckIn(raw);
  };

  const onStorage = (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      deliver(JSON.parse(e.newValue));
    } catch {
      /* ignore */
    }
  };

  window.addEventListener('storage', onStorage);

  let channel;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (e) => deliver(e.data);
  } catch {
    channel = null;
  }

  // Same-tab publish (rare) or a result left while the phone was already linking.
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      const parsed = JSON.parse(existing);
      // Only accept a fresh publish (last 2 minutes).
      if (parsed?.at && Date.now() - parsed.at < 120_000) deliver(parsed);
    }
  } catch {
    /* ignore */
  }

  return () => {
    window.removeEventListener('storage', onStorage);
    channel?.close();
  };
}
