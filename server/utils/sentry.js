/**
 * Sentry Error Tracking Integration
 * Gracefully activates when SENTRY_DSN is provided in environment variables;
 * falls back to standard console/log diagnostics otherwise.
 */

let sentryInitialized = false;

const initSentry = (app) => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      release: `eventviser-api@${process.env.npm_package_version || '1.0.0'}`,
    });
    sentryInitialized = true;
    console.log('✅ Sentry error tracking initialized successfully');
  } catch (err) {
    console.warn('⚠️ Sentry initialization skipped:', err.message);
  }
};

const captureException = (error, context = {}) => {
  if (sentryInitialized) {
    try {
      const Sentry = require('@sentry/node');
      Sentry.captureException(error, { extra: context });
    } catch {
      // Safe no-op
    }
  }
};

const captureMessage = (message, level = 'info') => {
  if (sentryInitialized) {
    try {
      const Sentry = require('@sentry/node');
      Sentry.captureMessage(message, level);
    } catch {
      // Safe no-op
    }
  }
};

module.exports = {
  initSentry,
  captureException,
  captureMessage,
  isSentryActive: () => sentryInitialized,
};
