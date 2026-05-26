# Energy LAB — Kurulum ve sunucuya yükleme

Bu uygulama **statik bir SPA**'dır: sunucuda yalnızca `ui/dist/` içindeki HTML, CSS ve JS dosyalarını sunmanız yeterlidir. Node.js üretim sunucusunda **zorunlu değildir** (build'i kendi makinenizde veya CI'da alıp `dist` klasörünü kopyalarsınız).

---

## 1. Yerelde geliştirme ve build

### Gereksinimler

- Node.js **18+** (önerilen: **20 LTS**)
- npm **9+**

### Adımlar

```bash
cd ui
npm install
npm run dev      # geliştirme → http://localhost:1043
npm run build    # üretim → ui/dist/
npm run preview  # build'i yerelde dene → http://localhost:1043
```

Build başarılı olduğunda örnek çıktı:

```
ui/dist/
  index.html
  assets/
    index-*.css
    index-*.js
```

Sunucuya **yalnızca `dist` içeriğini** yükleyin; `node_modules`, `src` veya kaynak Excel dosyalarını web köküne koymayın.

### Sık karşılaşılan hata: EACCES

`permission denied` alırsanız `ui` veya `node_modules` salt okunur olabilir:

```bash
chmod -R u+w /path/to/Energy_LAB/ui
```

Ardından `npm install` ve `npm run build` tekrar çalıştırın. **`sudo npm install` kullanmayın.**

---

## 2. Ne sunuluyor?

| Özellik | Değer |
|---------|--------|
| Tür | Tek sayfa uygulama (React, client-side) |
| API / backend | Yok |
| Ortam değişkenleri | Yok (`VITE_*` kullanılmıyor) |
| Routing | Sunucu tarafı route yok; tüm sekmeler client-side |

Herhangi bir statik dosya sunucusu veya CDN yeterlidir.

---

## 3. VPS / kendi sunucunuz (Nginx)

### 3.1 Build'i oluşturun (geliştirme makinesi veya CI)

```bash
cd ui && npm ci && npm run build
```

### 3.2 Dosyaları sunucuya kopyalayın

**rsync** (önerilen):

```bash
rsync -avz --delete ui/dist/ kullanici@sunucu.ip:/var/www/energy-lab/
```

**SCP**:

```bash
scp -r ui/dist/* kullanici@sunucu.ip:/var/www/energy-lab/
```

### 3.3 Nginx site yapılandırması

`/etc/nginx/sites-available/energy-lab`:

```nginx
server {
    listen 80;
    server_name model.ornekdomain.com;

    root /var/www/energy-lab;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Etkinleştirme:

```bash
sudo ln -s /etc/nginx/sites-available/energy-lab /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 3.4 HTTPS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d model.ornekdomain.com
```

---

## 4. Apache

DocumentRoot örneği: `/var/www/energy-lab`

```apache
<VirtualHost *:80>
    ServerName model.ornekdomain.com
    DocumentRoot /var/www/energy-lab

    <Directory /var/www/energy-lab>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Gerekirse `dist` içine `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 5. Netlify

1. Depoyu Git'e bağlayın.
2. Netlify **Build & deploy** ayarları:
   - **Base directory:** `ui`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. `ui/netlify.toml` bu ayarları tanımlar.

CLI ile deploy:

```bash
cd ui
npm run build
npx netlify deploy --prod --dir=dist
```

---

## 6. Vercel

1. [vercel.com](https://vercel.com) → Import repository.
2. **Root Directory:** `ui`
3. **Framework Preset:** Vite
4. Build: `npm run build`, Output: `dist`

CLI:

```bash
cd ui
npx vercel --prod
```

---

## 7. GitHub Pages

Alt yol kullanıyorsanız `ui/vite.config.js` içinde `base` ekleyin:

```js
export default defineConfig({
  plugins: [react()],
  base: '/Energy_LAB/',
})
```

Sonra:

```bash
cd ui
npm run build
npx gh-pages -d dist -b gh-pages
```

---

## 8. Docker (isteğe bağlı)

Proje kökünde `Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY ui/package*.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t energy-lab .
docker run -p 8080:80 energy-lab
```

---

## 9. Güncelleme prosedürü

1. `git pull`
2. `cd ui && npm ci && npm run build`
3. `rsync -avz --delete ui/dist/ kullanici@sunucu:/var/www/energy-lab/`
4. CDN cache invalidation (varsa)

---

## 10. Kontrol listesi

- [ ] `npm run build` hatasız tamamlanıyor
- [ ] Sunucuya sadece `dist` içeriği gidiyor
- [ ] Web kökü `index.html` gösteriyor
- [ ] HTTPS açık (üretim)
- [ ] `node_modules` web'den erişilemiyor
- [ ] `npm run preview` ile build test edildi
