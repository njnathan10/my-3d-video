import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { fonts } from "./tokens";

// Inter is bundled locally (variable font, all weights) so renders work
// offline and never stall on a font CDN.
let loaded = false;
export const ensureBrandFonts = () => {
  if (loaded) return;
  loaded = true;
  loadFont({
    family: fonts.family,
    url: staticFile("brand/fonts/Inter-Variable.woff2"),
    weight: "100 900",
  });
};
