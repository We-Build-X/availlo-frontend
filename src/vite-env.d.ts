/// <reference types="vite/client" />

// .geojson is just JSON with a different extension. Tell TypeScript
// it can be imported like a regular JSON module.
declare module "*.geojson" {
  const value: unknown;
  export default value;
}
