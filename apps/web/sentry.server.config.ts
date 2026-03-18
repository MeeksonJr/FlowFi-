import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://9be1ddf573c7c9f56045af1bfe10ed23@o4511067220672512.ingest.us.sentry.io/4511067224539136",
  tracesSampleRate: 1,
  debug: false,
});
