/**
 * ローカルファイルシステムの相対パスを解決する（Windows / Unix 両対応）。
 *
 * - Windows: `C:\Users\foo\doc.md` の隣にある `sub/other.md` → `C:/Users/foo/sub/other.md`
 * - Unix:    `/home/user/doc.md` の隣にある `sub/other.md` → `/home/user/sub/other.md`
 */
export function resolveLocalPath(currentFilePath: string, href: string): string {
  const normalized = currentFilePath.replace(/\\/g, "/");
  const resolved = new URL(href, `file:///${normalized}`);
  return decodeURIComponent(resolved.pathname.slice(1));
}
