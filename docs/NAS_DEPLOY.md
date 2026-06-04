# NAS 備援部署指南

> 給工程師看。將 `dist/` 目錄部署到家用 NAS，作為 Vercel 的備援來源。
> 本站為 100% 靜態站（除 `/api/trial-signup` 一個函式），NAS 端可選擇：
> - **方案 A**：純靜態（推薦）— `/api/trial-signup` 由 Vercel 提供，NAS 只 serve 靜態資產
> - **方案 B**：靜態 + 反代 — 表單也走 NAS，由 NAS 反代到 Vercel function 或自架 Node 程式

---

## 1. 需求與前提

- NAS 已對外開 80 / 443 port，或有 frp / Cloudflare Tunnel 出口
- NAS 系統：Synology DSM 7+ / QNAP / 通用 Linux（Debian / Ubuntu / Alpine）
- 已在 NAS 安裝 Docker（建議）或 Caddy / Nginx 套件
- 一個 git repo clone 到 NAS（之後 cron 會自動 pull）
- Node ≥ 22 安裝在 NAS（Synology 可用 Container Manager 跑 Node container）

---

## 2. 方案 A：Caddy（推薦，自動 HTTPS）

Caddy 自動申請 Let's Encrypt 憑證、自動續約、設定極簡。

### 2.1 Caddyfile

放在 `/etc/caddy/Caddyfile`（一般 Linux）或 `/volume1/docker/caddy/Caddyfile`（Synology）：

```caddyfile
jobsedu-backup.example.com {
    root * /srv/jobs-site/dist
    file_server
    encode zstd gzip

    # SPA fallback（但本站非 SPA，僅補強 trailing slash 行為）
    try_files {path} {path}/ {path}.html /404.html

    # 靜態資產長期 cache
    @assets {
        path /_astro/* /pagefind/* /uploads/* /favicon.svg
    }
    header @assets Cache-Control "public, max-age=31536000, immutable"

    # HTML 短 cache + must-revalidate
    @html {
        path *.html /
    }
    header @html Cache-Control "public, max-age=300, must-revalidate"

    # 安全標頭
    header {
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
        X-Frame-Options DENY
        Permissions-Policy "interest-cohort=()"
    }

    log {
        output file /var/log/caddy/jobsedu-access.log
        format console
    }
}
```

### 2.2 systemd service（一般 Linux）

```ini
# /etc/systemd/system/caddy.service（多數 Linux 套件已內建）
[Unit]
Description=Caddy
After=network.target

[Service]
ExecStart=/usr/bin/caddy run --config /etc/caddy/Caddyfile
ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

啟動：

```bash
sudo systemctl enable --now caddy
sudo systemctl status caddy
```

### 2.3 Synology 啟動方式

1. Container Manager → Registry → 搜尋 `caddy` → 下載 `caddy:latest`
2. 建立 Container：
   - Volume：`/volume1/docker/caddy/Caddyfile` → `/etc/caddy/Caddyfile`（唯讀）
   - Volume：`/volume1/docker/caddy/data` → `/data`（憑證儲存）
   - Volume：`/volume1/jobs-site/dist` → `/srv/jobs-site/dist`（唯讀）
   - Port：`80:80`、`443:443`
   - 自動重啟：是
3. 啟動後在 DSM Log Center 看 caddy 是否成功取得憑證

---

## 3. 方案 B：Nginx

若您已有 Nginx 在跑，加一個 server block 即可。

### 3.1 nginx.conf 片段

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name jobsedu-backup.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name jobsedu-backup.example.com;

    ssl_certificate     /etc/letsencrypt/live/jobsedu-backup.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jobsedu-backup.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    root /srv/jobs-site/dist;
    index index.html;

    # gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml application/javascript application/json application/rss+xml image/svg+xml;

    # 靜態資產長期 cache
    location ~* ^/(_astro|pagefind|uploads)/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 短 cache
    location ~* \.html$ {
        expires 5m;
        add_header Cache-Control "public, must-revalidate";
    }

    # SPA / trailing slash fallback
    location / {
        try_files $uri $uri/ $uri.html /404.html;
    }

    # 安全標頭
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "DENY" always;

    error_page 404 /404.html;
}
```

### 3.2 啟用設定

```bash
sudo ln -s /etc/nginx/sites-available/jobsedu-backup /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. SSL 設定

### 4.1 Caddy

完全自動化，不需手動操作。確認 NAS 80/443 對外開放即可。

### 4.2 Nginx + Let's Encrypt（certbot）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d jobsedu-backup.example.com
# 自動續約已透過 systemd timer 啟動，可驗證：
sudo systemctl list-timers | grep certbot
```

### 4.3 Cloudflare Origin Certificate（推薦）

若您把 NAS 放在 Cloudflare 後面（建議，可隱藏家用 IP）：

1. Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
2. 選 RSA 或 ECDSA、有效期 15 年
3. 下載 `cert.pem` 與 `key.pem` 放到 NAS
4. Nginx / Caddy 引用這兩個檔
5. SSL/TLS encryption mode 設為 **Full (strict)**

---

## 5. 自動化：cron 每天 git pull + build

把 NAS 上的 git repo 設定為定時拉取最新 main 並重新 build：

### 5.1 建立 deploy 腳本

`/srv/jobs-site/deploy.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /srv/jobs-site

# 拉取最新 main
git fetch origin main
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "[$(date -Iseconds)] up to date, skip"
    exit 0
fi

git reset --hard origin/main
npm ci --no-audit --no-fund
npm run build

# 通知（選配）
# curl -s -X POST -H 'Content-Type: application/json' \
#     -d "{\"text\":\"NAS rebuild done at $(date -Iseconds)\"}" \
#     https://hooks.slack.com/services/XXX

echo "[$(date -Iseconds)] rebuild complete"
```

設定權限：

```bash
chmod +x /srv/jobs-site/deploy.sh
```

### 5.2 cron

```bash
crontab -e
```

加入：

```cron
# 每天凌晨 3 點拉取並 build
0 3 * * * /srv/jobs-site/deploy.sh >> /var/log/jobs-site-deploy.log 2>&1
```

> **建議**：與 Vercel 自動部署錯開時間。Vercel 是 push 即觸發；NAS 走 cron 每天一次即可，避免兩邊同時 build 拖慢資源。

---

## 6. 故障排除

| 症狀 | 可能原因 | 處理方式 |
|---|---|---|
| 開站台顯示 404 | `dist/` 目錄是空的或路徑錯 | `ls /srv/jobs-site/dist` 確認，並重跑 `npm run build` |
| 憑證錯誤（HTTPS 警告） | Caddy 沒拿到憑證 / Nginx 設定錯 | Caddy 看 `journalctl -u caddy`；Nginx 重跑 certbot |
| `npm run build` 失敗 | Node 版本太舊、依賴未裝 | `node -v` 確認 ≥ 22；重跑 `npm ci` |
| 部署後內容沒更新 | 瀏覽器快取或 CDN 快取 | 強制重整（Ctrl + Shift + R）；若走 Cloudflare 在 dashboard purge cache |
| Pagefind 搜尋不能用 | build 後沒跑 `pagefind --site dist` | 確認 `package.json` 的 `build` script 含 `&& pagefind --site dist` |
| 表單送出 fail（方案 A） | NAS 沒提供 `/api/*` | 表單 `fetch` 的 origin 改指向 Vercel 主站，或改用方案 B 反代 |
| cron 沒跑 | 用戶權限 / PATH 問題 | 在 cron 開頭加 `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`；用絕對路徑呼叫 `npm` |

---

## 7. 切換 DNS 到 NAS（緊急情境）

當 Vercel 不可用時：

1. Cloudflare Dashboard → DNS → 把 `jobsedu.com.tw` A record 從 Vercel IP 改指向 NAS 對外 IP（或 CNAME 指向 NAS 用的 subdomain）
2. TTL 平時設 5 分鐘以利快速切換
3. 切回 Vercel：把 A record 改回 Vercel 提供的值

> **平時建議**：用 `jobsedu-backup.example.com` 當 NAS 站，平時不對外曝光，僅在緊急時切換正式 domain。
