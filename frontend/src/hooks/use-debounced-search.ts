import { useEffect, useState } from "react";

/**
 * Search box state machine per WO §16: 0 chars or 3+ chars trigger a search
 * (debounced); 1-2 chars are ignored so partial keystrokes never fire a request.
 */
export function useDebouncedSearch(delay = 400) {
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const shouldUpdate = inputValue.length === 0 || inputValue.length >= 3;
    if (!shouldUpdate) {
      return;
    }
    const handle = setTimeout(() => setSearchTerm(inputValue), delay);
    return () => clearTimeout(handle);
  }, [inputValue, delay]);

  return { inputValue, setInputValue, searchTerm };
}
