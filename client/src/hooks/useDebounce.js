// client/src/hooks/useDebounce.js
import { useEffect, useState } from "react";

/**
 * Debounce any value.
 * Example:
 *   const debouncedQuery = useDebounce(query, 300);
 */
export default function useDebounce(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
