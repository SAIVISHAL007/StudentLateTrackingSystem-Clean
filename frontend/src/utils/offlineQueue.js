// Offline queue for late marking
const STORAGE_KEY = 'offlineLateQueue';

export function enqueueLateMark(payload) {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  existing.push({ payload, timestamp: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getQueue() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export function clearQueue() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function flushQueue(apiInstance) {
  const queue = getQueue();
  if (queue.length === 0) return { flushed: 0, failures: [] };
  const failures = [];
  for (const item of queue) {
    try {
      await apiInstance.post('/students/mark-late', item.payload);
    } catch (err) {
      // Keep failed items and retry next time
      failures.push(item);
    }
  }
  // Only keep the failed items in the queue (remove successfully synced ones)
  if (failures.length < queue.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(failures));
  }
  return { flushed: queue.length - failures.length, failures: failures.map(f => ({ payload: f.payload, error: 'Failed to sync' })) };
}
