const deploymentHost =
  process.env.VERCEL_ENV === "preview"
    ? process.env.VERCEL_URL
    : (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL);
const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (deploymentHost ? `https://${deploymentHost}` : undefined);

// Static metadata needs a known origin. An unconfigured local build should
// omit absolute metadata instead of publishing a guessed development address.
export const siteUrl = configuredUrl
  ? new URL(configuredUrl).origin
  : undefined;

export function absoluteUrl(path: string, origin: string) {
  return new URL(path, origin).toString();
}

export function requestOrigin(request: Request) {
  // Next may normalize a loopback request URL to localhost. Preserve the public
  // host and protocol, including those supplied by the deployment's proxy.
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;
  const protocol =
    request.headers.get("x-forwarded-proto") ?? url.protocol.slice(0, -1);
  return new URL(`${protocol}://${host}`).origin;
}
