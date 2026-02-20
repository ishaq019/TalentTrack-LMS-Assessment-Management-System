// client/src/config/httpErrors.js

/**
 * Map common HTTP / Axios errors to user-friendly messages.
 *
 * @param {Error|import("axios").AxiosError} err
 * @param {string} fallback - default message when nothing specific matches
 * @returns {string}
 */
export function getHttpErrorMessage(err, fallback = "Something went wrong") {
  // Axios error with a server response
  if (err?.response) {
    const data = err.response.data;

    // API returns { error: "..." }
    if (typeof data?.error === "string") return data.error;

    // API returns { message: "..." }
    if (typeof data?.message === "string") return data.message;

    // Zod / validation array
    if (Array.isArray(data?.details)) {
      return data.details.map((d) => d.message).join(". ");
    }

    // Generic HTTP status messages
    const status = err.response.status;
    const statusMessages = {
      400: "Bad request — please check your input.",
      401: "Session expired — please log in again.",
      403: "You don't have permission to do that.",
      404: "Resource not found.",
      409: "Conflict — that resource already exists.",
      422: "Validation failed — please check your input.",
      429: "Too many requests — slow down and try again.",
      500: "Server error — please try again later.",
      502: "Bad gateway — the server is temporarily unavailable.",
      503: "Service unavailable — please try again shortly.",
    };
    if (statusMessages[status]) return statusMessages[status];
  }

  // Network error (no response at all)
  if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
    return "Network error — please check your connection.";
  }

  // Timeout
  if (err?.code === "ECONNABORTED") {
    return "Request timed out — please try again.";
  }

  // Plain Error with message
  if (typeof err?.message === "string" && err.message.length > 0) {
    return err.message;
  }

  return fallback;
}
