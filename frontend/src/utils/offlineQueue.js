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
      failures.push({ payload: item.payload, error: err.message });
    }
  }
  if (failures.length === 0) clearQueue();
  return { flushed: queue.length - failures.length, failures };
}
