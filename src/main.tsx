import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import "./styles.css"

// Self-heal stale lazy-chunk references after a redeploy. Route chunks
// are content-hashed, so a tab opened before a deploy 404s when it later
// navigates to a not-yet-loaded route ("Unable to preload CSS", "Failed
// to fetch dynamically imported module", ...). Detect that signature and
// reload once for the fresh manifest instead of hanging on a blank route.
const CHUNK_ERROR_RE =
  /preload|dynamically imported module|loading chunk|loading css chunk/i;
const CHUNK_RELOAD_KEY = "availlo_chunk_reload";
const alreadyReloaded = (() => {
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
  } catch {
    return true;
  }
})();
function recoverFromChunkError() {
  if (alreadyReloaded) return;
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    /* storage unavailable — reload anyway */
  }
  window.location.reload();
}
window.addEventListener(
  "error",
  (e) => {
    if (e.message && CHUNK_ERROR_RE.test(e.message)) recoverFromChunkError();
  },
  true,
);
window.addEventListener("unhandledrejection", (e) => {
  const reason = e.reason as { message?: unknown } | null | undefined;
  const msg = String(reason?.message ?? e.reason ?? "");
  if (CHUNK_ERROR_RE.test(msg)) recoverFromChunkError();
});
// If the boot stays healthy, clear the guard so a future redeploy can
// recover again instead of erroring out permanently.
window.setTimeout(() => {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    /* ignore */
  }
}, 15000);
const queryClient = new QueryClient()

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} context={{ queryClient }} />
      </QueryClientProvider>
    </React.StrictMode>,
  )
}
