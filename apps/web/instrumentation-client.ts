import posthog from 'posthog-js'
import * as Sentry from '@sentry/nextjs'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      defaults: '2026-01-30'
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
export default posthog
