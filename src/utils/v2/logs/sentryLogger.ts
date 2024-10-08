import * as Sentry from "@sentry/nextjs";

// All configurations are available in the root sentry files
export const logInfo = (message: string) => {
  message = "✅ " + message;
  if (process.env.NEXT_PUBLIC_DOMAIN?.startsWith("http://localhost")) {
    console.log(message);
  } else {
    Sentry.captureMessage(message);
  }
};

export const logError = (error: string) => {
  error = "❌ " + error;
  if (process.env.NEXT_PUBLIC_DOMAIN?.startsWith("http://localhost")) {
    console.log(error);
  } else {
    Sentry.captureException(error);
  }
};
