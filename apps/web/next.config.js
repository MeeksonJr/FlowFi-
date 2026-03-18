import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;

/*
export default withSentryConfig(nextConfig, {
  silent: true,
  org: "flowfi-di",
  project: "javascript-nextjs",
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  autoInstrumentAppDirectory: true,
});
*/
