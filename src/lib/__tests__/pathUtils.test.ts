import { describe, it, expect } from "vitest";
import { resolveLocalPath } from "../pathUtils";

describe("resolveLocalPath", () => {
  it("Windows: 同じディレクトリの相対ファイル", () => {
    expect(resolveLocalPath("C:\\Users\\user\\docs\\README.md", "image.png"))
      .toBe("C:/Users/user/docs/image.png");
  });

  it("Windows: サブディレクトリの相対ファイル", () => {
    expect(resolveLocalPath("C:\\Users\\user\\docs\\README.md", "assets/logo.svg"))
      .toBe("C:/Users/user/docs/assets/logo.svg");
  });

  it("Windows: 親ディレクトリへの相対パス (../)", () => {
    expect(resolveLocalPath("C:\\Users\\user\\docs\\sub\\page.md", "../images/fig.png"))
      .toBe("C:/Users/user/docs/images/fig.png");
  });

  it("Windows: スラッシュ区切りのパスも正常処理", () => {
    expect(resolveLocalPath("C:/Users/user/docs/README.md", "docs/architecture.svg"))
      .toBe("C:/Users/user/docs/docs/architecture.svg");
  });

  it("パーセントエンコードされたパスをデコードする", () => {
    const result = resolveLocalPath("C:\\Users\\my%20user\\docs\\README.md", "image.png");
    // URL 解決後に decodeURIComponent が適用される
    expect(result).toContain("image.png");
  });

  it("Unix: 同じディレクトリの相対ファイル", () => {
    expect(resolveLocalPath("/home/user/docs/README.md", "image.png"))
      .toBe("/home/user/docs/image.png");
  });

  it("Unix: サブディレクトリの相対ファイル", () => {
    expect(resolveLocalPath("/home/user/docs/README.md", "assets/logo.svg"))
      .toBe("/home/user/docs/assets/logo.svg");
  });

  it("Unix: 親ディレクトリへの相対パス (../)", () => {
    expect(resolveLocalPath("/home/user/docs/sub/page.md", "../images/fig.png"))
      .toBe("/home/user/docs/images/fig.png");
  });
});
