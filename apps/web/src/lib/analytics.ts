import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || initialized) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    loaded: () => {
      initialized = true;
    },
  });
  initialized = true;
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(name, props);
}
