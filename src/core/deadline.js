// Cancellation stops consumers immediately. Providers receive the signal; a
// provider ignoring it cannot commit a late observation into Core memory.
export function waitWithSignal(task, signal) {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    Promise.resolve().then(() => {
      signal.throwIfAborted();
      return task();
    }).then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}
