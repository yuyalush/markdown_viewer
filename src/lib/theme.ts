import lightMdCss from "github-markdown-css/github-markdown-light.css?inline";
import darkMdCss from "github-markdown-css/github-markdown-dark.css?inline";
import lightHljsCss from "highlight.js/styles/github.min.css?inline";
import darkHljsCss from "highlight.js/styles/github-dark.min.css?inline";

function injectStyle(id: string, css: string) {
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

export function applyTheme(dark: boolean) {
  injectStyle("md-theme", dark ? darkMdCss : lightMdCss);
  injectStyle("hljs-theme", dark ? darkHljsCss : lightHljsCss);
  document.body.classList.toggle("dark", dark);
}
