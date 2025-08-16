declare module "next-pwa" {
  import type { NextConfig } from "next";
  type PwaOptions = Record<string, unknown>;
  type WithPWA = (config: NextConfig) => NextConfig;
  const nextPWA: (options: PwaOptions) => WithPWA;
  export default nextPWA;
}
