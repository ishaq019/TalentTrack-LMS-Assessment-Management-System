// client/src/hooks/useMounted.js
import { useEffect, useRef } from "react";

export default function useMounted() {
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  return alive;
}
