import { describe, it, expect } from "vitest";
import {
  parseGitHubUrl,
  resolveGithubPath,
  buildRawUrl,
} from "../github";

describe("parseGitHubUrl", () => {
  it("標準的な HTTPS GitHub URL を解析", () => {
    expect(parseGitHubUrl("https://github.com/owner/repo")).toEqual({
      owner: "owner",
      repo: "repo",
    });
  });

  it(".git サフィックスを除去する", () => {
    expect(parseGitHubUrl("https://github.com/owner/repo.git")).toEqual({
      owner: "owner",
      repo: "repo",
    });
  });

  it("サブパスを含む URL でも owner/repo を取得", () => {
    expect(parseGitHubUrl("https://github.com/yuyalush/astro_azure_swa/blob/main/docs/architecture.svg")).toEqual({
      owner: "yuyalush",
      repo: "astro_azure_swa",
    });
  });

  it("GitHub URL でない場合は null を返す", () => {
    expect(parseGitHubUrl("https://gitlab.com/owner/repo")).toBeNull();
    expect(parseGitHubUrl("https://example.com")).toBeNull();
  });
});

describe("resolveGithubPath", () => {
  it("ルートにある README.md からの相対パスを解決", () => {
    expect(resolveGithubPath("README.md", "docs/architecture.svg"))
      .toBe("docs/architecture.svg");
  });

  it("サブディレクトリの Markdown からの相対パスを解決", () => {
    expect(resolveGithubPath("docs/guide.md", "images/fig.png"))
      .toBe("docs/images/fig.png");
  });

  it("親ディレクトリへの相対パス (../) を解決", () => {
    expect(resolveGithubPath("docs/sub/page.md", "../assets/logo.svg"))
      .toBe("docs/assets/logo.svg");
  });

  it("ルートへの相対パスを解決", () => {
    expect(resolveGithubPath("docs/guide.md", "../README.md"))
      .toBe("README.md");
  });
});

describe("buildRawUrl", () => {
  it("raw.githubusercontent.com URL を正しく構築する", () => {
    expect(buildRawUrl("yuyalush", "astro_azure_swa", "main", "docs/architecture.svg"))
      .toBe("https://raw.githubusercontent.com/yuyalush/astro_azure_swa/main/docs/architecture.svg");
  });

  it("ルートファイルの URL を構築する", () => {
    expect(buildRawUrl("owner", "repo", "master", "README.md"))
      .toBe("https://raw.githubusercontent.com/owner/repo/master/README.md");
  });

  // 今回のバグ修正シナリオ:
  // README.md 内に ![サービスアーキテクチャ](docs/architecture.svg) と書かれている場合
  it("README からの画像パスを raw URL に変換できる（バグ修正シナリオ）", () => {
    const currentPath = "README.md";
    const imgSrc = "docs/architecture.svg";
    // resolveGithubPath で相対パスを解決し buildRawUrl で raw URL を構築
    const { resolveGithubPath: resolve } = { resolveGithubPath };
    const resolvedPath = resolve(currentPath, imgSrc);
    const rawUrl = buildRawUrl("yuyalush", "astro_azure_swa", "main", resolvedPath);
    expect(rawUrl).toBe(
      "https://raw.githubusercontent.com/yuyalush/astro_azure_swa/main/docs/architecture.svg"
    );
  });
});
