/** AI parse is on unless explicitly disabled with VITE_ENABLE_WOD_AI_PARSE=false. */
export const WOD_AI_PARSE_ENABLED =
  import.meta.env.VITE_ENABLE_WOD_AI_PARSE !== "false";
