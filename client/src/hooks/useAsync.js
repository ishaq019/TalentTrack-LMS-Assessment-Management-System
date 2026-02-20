// client/src/hooks/useAsync.js
import { useCallback, useState } from "react";
import { getHttpErrorMessage } from "@/config/httpErrors.js";

/**
 * Wrap an async function with loading/error.
 *
 * Example:
 *   const { run, loading, error } = useAsync(async () => api.get("/admin/tests"));
 *   useEffect(() => { run(); }, []);
 */
export default function useAsync(asyncFn, { initialLoading = false } = {}) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState("");

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError("");
      try {
        const result = await asyncFn(...args);
        return result;
      } catch (e) {
        const msg = getHttpErrorMessage(e, "Request failed");
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { run, loading, error, setError };
}
