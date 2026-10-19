import type { NextConfig } from 'next';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvConfig } from '@next/env';

const frontendRoot = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(frontendRoot, '..');
const loadedEnvironment = loadEnvConfig(projectRoot, process.env.NODE_ENV !== 'production', console, true);
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? loadedEnvironment.combinedEnv.NEXT_PUBLIC_API_URL;
const apiMediaPatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [];
if (apiBaseUrl) {
  const apiUrl = new URL(apiBaseUrl);
  apiMediaPatterns.push({
    protocol: apiUrl.protocol.slice(0, -1) as 'http' | 'https',
    hostname: apiUrl.hostname,
    port: apiUrl.port,
    pathname: `${apiUrl.pathname.replace(/\/$/, '')}/media/**`,
  });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
  // Explicitly inline the API origin into client bundles. The login form runs
  // in the browser and cannot read the server's runtime process.env object.
  env: apiBaseUrl
    ? { NEXT_PUBLIC_API_URL: apiBaseUrl }
    : {},
  images: { remotePatterns: apiMediaPatterns },
};
export default nextConfig;
