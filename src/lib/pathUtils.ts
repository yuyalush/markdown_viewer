/**
 * ローカルファイルシステムの相対パスを解決する（Windows / Unix 両対応）。
 *
 * - Windows: `C:\Users\foo\doc.md` の隣にある `sub/other.md` → `C:/Users/foo/sub/other.md`
 * - Unix:    `/home/user/doc.md` の隣にある `sub/other.md` → `/home/user/sub/other.md`
 */
export function resolveLocalPath(currentFilePath: string, href: string): string {
  const normalized = currentFilePath.replace(/\\/g, "/");
  const resolved = new URL(href, `file:///${normalized}`);
  const path = resolved.pathname;
  return decodeURIComponent(/^\/[A-Za-z]:\//.test(path) ? path.slice(1) : path);
}
