import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base = repo name so deployed assets resolve under /relatum-risk-aggregator/.
// HashRouter handles client-side routes; data/out/* is served as static assets via publicDir.
export default defineConfig({
  base: '/relatum-risk-aggregator/',
  plugins: [react()],
  // publicDir holds favicon + the GENERATED data the SPA fetches (public/data/index.json,
  // public/data/protocols/<slug>.json — emitted by data/build/build-all.mjs). The data/
  // folder remains the source of truth (ontology, adapters, seeds, build); public/data/
  // is the rendered artifact Vite serves at /data/ in dev and copies into dist/ on build.
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
