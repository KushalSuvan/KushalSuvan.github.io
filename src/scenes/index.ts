import type { Scene } from "../engine/scene";
import request from "./request";

/** Every scene a post can name in <hl-scrolly scene="…"> (spec/07-scrolly-canvas.md, SCN-2). */
export const SCENES: Record<string, Scene> = { request };
