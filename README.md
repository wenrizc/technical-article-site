# 技术与成长精选静态站

这个项目是 `technical-article-curation` 的独立展示层。构建时通过上游 FastAPI 公共接口拉取技术、科研、学习路线和成长内容数据，并生成可部署到 GitHub Pages 的静态 HTML。

前端方案：

- Astro 负责静态页面生成。
- Pagefind 负责纯静态关键词检索。

## 上游接口

默认读取：

- `GET /api/public/index.json`
- `GET /api/public/articles/{slug}`

接口中的 `tags` 是上游词库审核通过后的正式标签；AI 原始候选标签不会直接出现在静态站标签页。上游评估阶段的新增标签建议会先进入后端 `tag_candidates` 审核流，静态站只消费公开 API 中已经回填到文章的正式标签。

通过环境变量配置上游地址：

```bash
TAC_API_BASE_URL=http://127.0.0.1:1104
```

当上游接口暂时不可达且 `TAC_API_STRICT` 未设为 `true` 时，构建会回退到 `src/fixtures/articles.json`，便于本地预览。部署环境建议设置 `TAC_API_STRICT=true`，让 API 异常直接暴露为构建失败。

## 本地开发

```bash
npm install
cp .env.example .env
npm run dev
```

构建：

```bash
npm run build
```

构建会先执行 `astro build`，再执行 `pagefind --site dist` 生成搜索索引。

预览构建结果：

```bash
npm run preview
```

## GitHub Pages

仓库需要配置：

- Secret: `TAC_API_BASE_URL`
- Variable: `SITE_URL`
- Variable: `BASE_PATH`，项目页通常是 `/<repo-name>/`，用户根站或自定义域名可设为 `/`

`.github/workflows/pages.yml` 会在每天 UTC 22:20 定时构建并部署，也支持手动触发。
