const CLOUDFLARE_BEACON_URL = 'https://static.cloudflareinsights.com/beacon.min.js';

export function initCloudflareWebAnalytics(token: string): void {
  const trimmed = token.trim();
  if (!trimmed) {
    return;
  }

  const script = document.createElement('script');
  script.defer = true;
  script.src = CLOUDFLARE_BEACON_URL;
  script.setAttribute('data-cf-beacon', JSON.stringify({ token: trimmed }));
  document.head.appendChild(script);
}
