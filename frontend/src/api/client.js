const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiFetch(path, options = {}) {
  const { retries = 2, timeout = 12000, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const maxAttempts = method === 'GET' ? retries + 1 : 1;

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const externalSignal = fetchOptions.signal;
    let abortedByTimeout = false;

    const timeoutId = setTimeout(() => {
      abortedByTimeout = true;
      controller.abort();
    }, timeout);

    const onExternalAbort = () => controller.abort();
    externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const response = await fetch(`${API}${path}`, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(fetchOptions.headers || {}),
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const requestError = new Error(
          body.message || `Request failed (${response.status})`,
        );
        requestError.status = response.status;
        throw requestError;
      }

      return response.status === 204 ? null : response.json();
    } catch (requestError) {
      if (externalSignal?.aborted) {
        throw new DOMException('Request aborted', 'AbortError');
      }

      lastError = requestError;
      const transient =
        abortedByTimeout ||
        !requestError.status ||
        requestError.status >= 500;

      if (!transient || attempt === maxAttempts - 1) {
        if (abortedByTimeout) {
          throw new Error('The request took too long. Please try again.');
        }

        if (requestError.name === 'TypeError') {
          throw new Error(
            'Unable to reach the server. Check your connection and try again.',
          );
        }

        throw requestError;
      }

      await sleep(400 * (attempt + 1));
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }

  throw lastError || new Error('Request failed.');
}

export const imageUrl = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

export { API };
