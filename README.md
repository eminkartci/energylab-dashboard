# Energy LAB — PV / Wind / BESS Financial Model

React + Vite ile geliştirilmiş, tamamen tarayıcıda çalışan finansal model arayüzü. Backend veya veritabanı gerekmez; üretim build'i statik dosyalardan oluşur.

## Proje yapısı

| Yol | Açıklama |
|-----|----------|
| `ui/` | Web uygulaması (kaynak kod, `npm` komutları burada) |
| `ui/dist/` | `npm run build` çıktısı — sunucuya yüklenecek dosyalar |
| `*.xlsx` | Referans Excel modelleri (uygulama bunları sunmaz) |

## Gereksinimler

- **Node.js** 18+ (önerilen: 20 LTS veya 22)
- **npm** 9+

## Hızlı başlangıç

```bash
cd ui
npm install
npm run dev
```

Tarayıcı: [http://localhost:1043](http://localhost:1043)

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu (hot reload) |
| `npm run build` | Production build → `ui/dist/` |
| `npm run preview` | Build'i yerelde test → http://localhost:1043 |

## Sunucuya yükleme

Ayrıntılı rehber: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**  
(Nginx, VPS, Netlify, Vercel, rsync/SCP, Docker)

## İzin sorunu (EACCES)

Klasörler salt okunursa (`dr-xr-xr-x`) `npm install` veya `vite` yazamaz:

```bash
chmod -R u+w ui
```

`sudo npm` kullanmayın.
