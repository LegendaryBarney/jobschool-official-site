# 貢獻指南

## 分支策略

- `main` — 部署主幹，僅接受通過 CI 的 PR
- `dev` — 整合分支
- `feature/*` — 功能開發
- `fix/*` — bug 修復
- `chore/*` — 設定、CI、依賴調整

## Commit 規範

採 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/v1.0.0/)。Commit 訊息使用英文。

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

常用 type：

| type | 用途 |
|---|---|
| `feat` | 新增功能 |
| `fix` | 修 bug |
| `docs` | 文件 |
| `style` | 格式（不影響邏輯） |
| `refactor` | 重構 |
| `perf` | 效能優化 |
| `test` | 測試 |
| `chore` | 雜項 |
| `ci` | CI 設定 |

範例：

```
feat(home): add hero section with brand tokens
fix(form): correct phone number regex
docs: update README with env variables
```

## PR 流程

1. 從 `dev` 開出 `feature/xxx`
2. 開發 + commit（一個 commit 一件事）
3. PR 回 `dev`，PR 描述可中文，需附畫面截圖（若有 UI 變動）
4. 通過 lint / build 後 squash merge
5. 由維護者統一從 `dev` 合到 `main` 觸發部署

## 程式碼風格

- TypeScript：strict 模式
- 格式化：Prettier（`.prettierrc` 已設定）
- 命名：清晰命名取代註解；除非業務邏輯特別不直觀
