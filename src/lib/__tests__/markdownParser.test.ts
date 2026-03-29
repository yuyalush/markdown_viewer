import { describe, it, expect } from "vitest";
import { renderMarkdown, renderMarkdownSafe } from "../markdownParser";

describe("renderMarkdown", () => {
  it("空文字列は空文字列を返す", () => {
    expect(renderMarkdown("")).toBe("");
  });

  it("見出しを HTML に変換する", () => {
    const html = renderMarkdown("# Hello");
    expect(html).toContain("<h1");
    expect(html).toContain("Hello");
  });

  it("太字を HTML に変換する", () => {
    const html = renderMarkdown("**bold**");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("コードブロックを hljs クラス付きで出力する", () => {
    const html = renderMarkdown("```js\nconsole.log('hi');\n```");
    expect(html).toContain("hljs");
  });

  it("Mermaid ブロックを <pre class=\"mermaid\"> として出力する", () => {
    const html = renderMarkdown("```mermaid\ngraph TD;\nA-->B;\n```");
    expect(html).toContain('<pre class="mermaid">');
  });

  it("画像タグを出力する", () => {
    const html = renderMarkdown('![alt text](docs/architecture.svg)');
    expect(html).toContain('<img');
    expect(html).toContain('src="docs/architecture.svg"');
    expect(html).toContain('alt="alt text"');
  });

  it("リンクを出力する", () => {
    const html = renderMarkdown("[GitHub](https://github.com)");
    expect(html).toContain('<a href="https://github.com"');
  });
});

describe("renderMarkdownSafe", () => {
  it("空文字列は空文字列を返す", () => {
    expect(renderMarkdownSafe("")).toBe("");
  });

  it("通常の Markdown を HTML に変換する", () => {
    const html = renderMarkdownSafe("# Title\nParagraph.");
    expect(html).toContain("<h1");
    expect(html).toContain("Title");
    expect(html).toContain("Paragraph.");
  });

  it("<script> タグをサニタイズして除去する", () => {
    const html = renderMarkdownSafe('<script>alert("xss")</script>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert");
  });

  it("onclick 属性を除去する", () => {
    const html = renderMarkdownSafe('<a href="#" onclick="evil()">click</a>');
    expect(html).not.toContain("onclick");
  });
});
