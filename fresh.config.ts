import type { FreshConfig } from "$fresh/server.ts";
import denostories from "https://raw.githubusercontent.com/CAYdenberg/denostories/0.3.0/mod.ts";

export default {
  plugins: [
    denostories(),
  ],
} as FreshConfig;
