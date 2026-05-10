# Skyline

**Hyperlocal weather, animated radar, severe alerts, and a 30-day construction workability outlook — built as a single-file PWA with no build step.**

Apple-iOS aesthetic, GPS-first by default, free public APIs, installable on iPhone/Android/desktop.

**Production URL:** https://weather.nepa-pro.com

---

## Features

- **GPS-first location** — auto-detects on launch with a friendly iOS-style permission sheet, then auto-tracks as you move between job sites
- **Today** — large hero temp, hourly strip, 10-day gradient bars, 8 metric tiles (UV with conic ring, wind+gusts, humidity+dewpoint, pressure, visibility, US AQI, sunrise/sunset, precipitation)
- **Radar** — animated tile loop with past + nowcast frames (RainViewer), play/pause, scrubber, future-frame indicator (Leaflet basemap)
- **30-Day Construction Outlook** — every day scored 0–100 against rain probability, precipitation amount, snow, wind gusts, freeze/heat thresholds, and active NWS alerts. Days 1–16 from real Open-Meteo data; 17–30 extrapolated and labeled accordingly
- **NWS Alerts** — severity-colored cards (warning / advisory / watch), auto-fetched for the current point
- **Air quality** — full pollutant breakdown + US AQI category color
- **Rain banner** — Dynamic-Island-style pill notifies "Rain in ~X min · Y% chance" when precipitation expected within 60 minutes
- **Service worker** — offline-friendly, network-first for weather data, periodic-sync rain alerts
- **Full SEO/AI metadata** — OpenGraph, Twitter Card, Apple touch meta, JSON-LD (WebApplication, Organization, WebSite with SearchAction, FAQPage, speakable spec for Siri/Google Assistant), preconnects, dynamic title/meta-description per location

## APIs Used (all free, no keys required)

| Provider | Used for |
|---|---|
| [Open-Meteo](https://open-meteo.com) | Current/hourly/16-day forecast + 15-min nowcast |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | Forward search (city → coords) |
| [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | US AQI + pollutant breakdown |
| [BigDataCloud](https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api) | Reverse geocoding (coords → city name) |
| [api.weather.gov (NWS)](https://www.weather.gov/documentation/services-web-api) | Severe weather alerts (US point queries) |
| [RainViewer](https://www.rainviewer.com/api.html) | Animated radar tiles (past + nowcast) |
| [unpkg](https://unpkg.com) | Leaflet 1.9.4 (CDN) |

## Deploy to GitHub Pages

This repo auto-deploys via GitHub Actions on every push to `main`.

### One-time setup

1. **Push this repo to GitHub** (e.g., as `nepa-pro/skyline` or under any account)
2. **Settings → Pages → Build and deployment → Source:** choose **"GitHub Actions"** (not "Deploy from a branch")
3. **Settings → Pages → Custom domain:** the included `CNAME` file already configures `weather.nepa-pro.com`. After the first deploy, check **"Enforce HTTPS"** once the cert finishes provisioning (~10 minutes after DNS resolves)

### DNS configuration for `weather.nepa-pro.com`

Add **one** of these records at your DNS provider for `nepa-pro.com`:

**Recommended — CNAME (works for any GitHub username):**
```
Type:  CNAME
Host:  weather
Value: <your-github-username>.github.io
TTL:   3600
```

**Alternative — A records (apex/root style, four entries):**
```
Type: A    Host: weather    Value: 185.199.108.153
Type: A    Host: weather    Value: 185.199.109.153
Type: A    Host: weather    Value: 185.199.110.153
Type: A    Host: weather    Value: 185.199.111.153
```

After DNS propagates (usually 5–60 min), GitHub will provision a Let's Encrypt cert automatically. The site will be live at **https://weather.nepa-pro.com**.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML + inline CSS + inline JS) |
| `manifest.webmanifest` | PWA manifest (install metadata, shortcuts, share target, protocol handlers) |
| `sw.js` | Service worker (caching strategy + rain-alert periodic sync) |
| `icon.svg` | App icon (Apple touch icon spec) |
| `og-card.png` | 1200×630 social share card (PNG for Twitter/Facebook/LinkedIn compatibility) |
| `og-card.svg` | Source SVG for the OG card (regenerate the PNG with cairosvg if edited) |
| `404.html` | Soft-redirects unknown paths back to the app |
| `robots.txt` | Search-engine + AI crawler rules |
| `sitemap.xml` | Single-page sitemap (with view variants for radar/outlook/alerts) |
| `CNAME` | GitHub Pages custom domain config |
| `.github/workflows/deploy.yml` | GitHub Pages auto-deploy |

## Local development

No build step. Just serve the folder over HTTP:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000`. **Note:** geolocation, service workers, and notifications all require HTTPS in production, but `localhost` is treated as secure for testing.

### Regenerating the OG card

If you edit `og-card.svg`, regenerate the PNG with:

```bash
pip install cairosvg
python3 -c "import cairosvg; cairosvg.svg2png(url='og-card.svg', write_to='og-card.png', output_width=1200, output_height=630)"
```

## License

MIT
