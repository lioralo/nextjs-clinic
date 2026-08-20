"use client";

import { useEffect, useState } from "react";

/** Client-only match for phone-width layouts. Starts false on the server. */
export function useNarrowScreen(query = "(max-width: 767px)") {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const apply = () => setNarrow(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [query]);

  return narrow;
}
