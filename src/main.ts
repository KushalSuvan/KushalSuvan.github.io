/** The one entry every page loads (ARCH-2): fonts, styles, elements, page behaviours. */
import "@fontsource-variable/source-serif-4/wght.css";
import "@fontsource-variable/source-serif-4/wght-italic.css";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/exhibits.css";
import "./styles/prose.css";
import { HlFigure } from "./elements/hl-figure";
import { HlPlot } from "./elements/hl-plot";
import { HlScrolly } from "./elements/hl-scrolly";
import { page } from "./elements/page";

customElements.define("hl-figure", HlFigure);
customElements.define("hl-plot", HlPlot);
customElements.define("hl-scrolly", HlScrolly);
page();
