"use client";

import { createClient } from "@supabase/supabase-js";

// Public (publishable) credentials — safe in browser code. Access is enforced by row-level security.
const URL = "https://mrffcbdlhdmkbqlvppic.supabase.co";
const KEY = "sb_publishable_vKqM08AKjNCA-rrNQhKuJw_9V3d11Ll";

export const db = createClient(URL, KEY, {
  global: {
    fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (h.get("Authorization") === `Bearer ${KEY}`) h.delete("Authorization");
      h.set("apikey", KEY);
      return fetch(input, { ...init, headers: h });
    },
  },
});
