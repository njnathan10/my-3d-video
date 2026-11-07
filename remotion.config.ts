import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// WebGL (three.js) needs a GPU-capable GL backend in headless Chrome.
// "angle" works on most machines; use "swangle" on servers without a GPU.
Config.setChromiumOpenGlRenderer(
  (process.env.REMOTION_GL as "angle" | "swangle" | "egl" | "swiftshader") ?? "angle",
);
// Optional: point at an existing Chrome/Chromium instead of auto-downloading one.
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
