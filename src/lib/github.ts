/** GitHub API レスポンス型 */
export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch: string;
}

interface GitHubRepoApiResponse {
  default_branch: string;
}

interface GitHubTreeApiResponse {
  tree: Array<{ type: string; path: string }>;
}

/** GitHub リポジトリ URL を解析して owner と repo を返す */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

/** GitHub リポジトリ内の相対パスを解決する */
export function resolveGithubPath(currentPath: string, href: string): string {
  const resolved = new URL(href, `https://x/${currentPath}`);
  return resolved.pathname.slice(1);
}

/** GitHub raw コンテンツの URL を構築する */
export function buildRawUrl(owner: string, repo: string, branch: string, path: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

/** GitHub API からリポジトリのデフォルトブランチを取得する */
export async function fetchDefaultBranch(owner: string, repo: string): Promise<string> {
  const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!resp.ok) throw new Error(`リポジトリ情報の取得に失敗: HTTP ${resp.status}`);
  const data = await resp.json() as GitHubRepoApiResponse;
  return data.default_branch;
}

/** GitHub API からリポジトリ内の .md / .markdown ファイル一覧を取得する */
export async function fetchMdFilePaths(owner: string, repo: string, branch: string): Promise<string[]> {
  const resp = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: { Accept: "application/vnd.github+json" } },
  );
  if (!resp.ok) return [];
  const data = await resp.json() as GitHubTreeApiResponse;
  return data.tree
    .filter((f) => f.type === "blob" && /\.(md|markdown)$/i.test(f.path))
    .map((f) => f.path);
}

/**
 * README.md を候補パス順で取得し、コンテンツとパスを返す。
 * 見つからない場合は例外を投げる。
 */
export async function fetchReadme(
  owner: string,
  repo: string,
  branch: string,
): Promise<{ content: string; path: string }> {
  const candidates = ["README.md", "readme.md", "Readme.md", "README.markdown"];
  for (const path of candidates) {
    const resp = await fetch(buildRawUrl(owner, repo, branch, path));
    if (resp.ok) return { content: await resp.text(), path };
  }
  throw new Error("README.md が見つかりませんでした");
}
