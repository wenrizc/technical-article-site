import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type Level = "high" | "medium" | "low";

export interface ArticleSummary {
  id?: number;
  slug: string;
  title: string;
  url: string;
  source: string;
  publish_policy?: "full_content" | "summary_only";
  published_at?: string | null;
  collected_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  summary?: string | null;
  tags?: string[];
  recommendation_reason?: string | null;
  dimensions?: Record<string, Level>;
}

export interface ArticleDetail extends ArticleSummary {
  content_markdown?: string | null;
  markdown?: string | null;
}

function apiBaseUrl(): string {
  const value = process.env.TAC_API_BASE_URL;
  if (!value) {
    return "";
  }
  return value.replace(/\/+$/, "");
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) {
    return readFixture<T>(path);
  }
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function readFixture<T>(path: string): Promise<T> {
  const fixturePath = join(process.cwd(), "src/fixtures/articles.json");
  const articles = JSON.parse(await readFile(fixturePath, "utf-8")) as ArticleDetail[];
  if (path === "/api/public/index.json") {
    return articles.map(({ content_markdown, markdown, ...article }) => article) as T;
  }
  const match = path.match(/^\/api\/public\/articles\/(.+)$/);
  if (match) {
    const slug = decodeURIComponent(match[1]);
    const article = articles.find((item) => item.slug === slug);
    if (!article) {
      throw new Error(`Fixture article not found: ${slug}`);
    }
    return article as T;
  }
  throw new Error(`Unsupported fixture path: ${path}`);
}

export async function getAllArticles(): Promise<ArticleSummary[]> {
  return fetchJson<ArticleSummary[]>("/api/public/index.json");
}

export async function getArticle(slug: string): Promise<ArticleDetail> {
  return fetchJson<ArticleDetail>(`/api/public/articles/${encodeURIComponent(slug)}`);
}

export function articleDate(article: ArticleSummary): Date | null {
  const value = article.published_at || article.collected_at || article.updated_at || article.created_at;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(article: ArticleSummary): string {
  const date = articleDate(article);
  if (!date) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function uniqueTags(articles: ArticleSummary[]): string[] {
  return Array.from(new Set(articles.flatMap((article) => article.tags || []))).sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

export function articlesByTag(articles: ArticleSummary[], tag: string): ArticleSummary[] {
  return articles.filter((article) => article.tags?.includes(tag));
}

export function uniqueSources(articles: ArticleSummary[]): string[] {
  return Array.from(new Set(articles.map((article) => article.source).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, "zh-CN"),
  );
}
