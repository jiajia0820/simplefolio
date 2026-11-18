import initScrollReveal from "./scripts/scrollReveal";
import initTiltEffect from "./scripts/tiltAnimation";
import initUiGallery from "./scripts/uiGallery";
import initContactLinks from "./scripts/contactLinks";
import { targetElements, defaultProps } from "./data/scrollRevealConfig";

initScrollReveal(targetElements, defaultProps);
initTiltEffect();
initUiGallery();
initContactLinks();
