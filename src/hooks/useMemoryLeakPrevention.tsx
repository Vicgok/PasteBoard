import { MemoryLeakPrevention } from "@/utils/memoryLeakPrevention";
import { useEffect } from "react";

export function useMemoryLeakPrevention() {
  useEffect(() => {
    return () => {
      MemoryLeakPrevention.cleanup();
    };
  }, []);
}
