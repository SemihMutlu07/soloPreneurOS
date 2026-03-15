# soloPreneurOS

> **Demo / Learning Project** — Bu proje bir ürün demosu ve öğrenme amaçlıdır. Production kullanımı için hazırlanmamıştır.

Solo kurucular için yapay zeka destekli birleşik bir işletim sistemi. Sales-OS, Hire-OS ve Finance-OS modüllerini tek çatı altında toplar; aralarındaki bağlantıları keşfeder ve proaktif içgörüler üretir.

---

## Ne Bu Proje?

**"Bugün ne kararı vermeliyim?"** sorusunu cevaplamak için tasarlandı.

Üç ayrı modülün verilerini birleştiren bir zeka katmanı (Intelligence Layer), rule-based + LLM destekli bir pipeline üzerinden cross-module içgörüler üretir:

- Satış hattındaki hot lead'lerin olduğu dönemde nakit akışı kritik mi?
- İşe alım süreci açık kalırken gelir sessizliği mi var?
- Teklif aşamasındaki deal'ler varken büyük fatura ödemesi mi geliyor?

Bunları insan manuel takip etmeden sistemin tespit etmesi hedeflendi.

---

## Yapı ve Özellikler

### Modüller

| Modül | Açıklama | Durum |
|-------|----------|-------|
| **Sales-OS** | Lead pipeline (9 aşama), AI scoring, Gmail entegrasyonu, draft yanıt üretimi | Demo (mock data + UI) |
| **Hire-OS** | Aday pipeline, Claude ile CV değerlendirme, mülakat planlama, e-posta bildirimleri | Production-ready |
| **Finance-OS** | Fatura yönetimi, KDV/Stopaj hesabı, gider takibi, vergi takvimi, runway hesabı | Semi-real (Supabase + localStorage) |
| **Intelligence** | Cross-module içgörü pipeline, rule engine (7 kural), LLM narrative, cron | %85 tamamlandı |

### Yapay Zeka Özellikleri

- **Lead Değerlendirme** — Her lead için 0-100 AI skoru, sinyal listesi ve önerilen aksiyonlar
- **Aday Değerlendirme** — CV parsing + Claude ile GÖRÜŞ/GEÇME/BEKLET önerisi
- **Draft Yanıt** — Lead'e gönderilecek e-posta taslağı üretimi
- **Chief of Staff** — Günlük görev önceliklendirme (Claude API)
- **Market Scout** — HN, Product Hunt, Reddit'ten dış sinyaller
- **Narrative Generation** — Tüm modülleri özetleyen 2 cümlelik founder brief (Claude Haiku)
- **Rule Engine** — 7 deterministik cross-module kural (API maliyeti sıfır)

### Rule Engine Kuralları

| ID | Kural | Tetikleyici |
|----|-------|-------------|
| R1 | Runway + Hot Leads | Nakit < 60 gün + hot lead var |
| R2 | Hire + Runway | İşe alım açık ama runway yetmez |
| R3 | Deals + Candidates | Satış kapanmak üzere ama aday eksik |
| R4 | Revenue Silence | 60+ gündür fatura yok |
| R5 | Candidate Stall | 30+ gün ilerlememiş aday |
| R6 | Invoice + Payroll | 10.000+ TL fatura ödemesi geliyor |
| R7 | Hot Leads No Reply | 7+ gün cevap verilmemiş sıcak lead |

### API Endpoint'leri

```
# Intelligence
GET  /api/intelligence/insights          # Tüm aktif içgörüler (severity sıralı)
GET  /api/intelligence/nudges?module=X   # Modüle göre filtrelenmiş nudge'lar
POST /api/intelligence/dismiss           # İçgörü soft-delete
POST /api/intelligence/trigger           # Pipeline tetikleme (fire-and-forget)

# Cron Jobs
GET  /api/cron/run-intelligence          # Günlük cross-module pipeline
GET  /api/cron/evaluate-leads            # Toplu lead değerlendirme
GET  /api/cron/scan-gmail                # Gmail → hiring candidate tarama
GET  /api/cron/scan-sales-gmail          # Gmail → satış lead tarama

# Finance
GET  /api/finance/invoices
POST /api/finance/invoices
GET  /api/finance/expenses
GET  /api/finance/tax-provisions

# Hiring
GET  /api/hiring/candidates
POST /api/hiring/candidates
GET  /api/hiring/candidates/[id]
PUT  /api/hiring/candidates/[id]
POST /api/hiring/candidates/[id]/interview

# Sales
GET  /api/sales/leads
POST /api/sales/leads
GET  /api/sales/leads/[id]
PUT  /api/sales/leads/[id]
POST /api/sales/leads/[id]/reply
```

---

## Teknik Yığın

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Frontend | React 19, Tailwind CSS 4, Lucide React |
| Veritabanı | Supabase (PostgreSQL + Auth + RLS) |
| AI | Anthropic Claude API (Sonnet for evals, Haiku for narrative) |
| E-posta | Resend |
| Gmail | Google APIs (OAuth2) |
| Deployment | Vercel (cron job desteği) |
| Test | Vitest |

---

## Proje İlerleme Durumu

Bu proje **7 fazlık bir roadmap** üzerinde geliştirildi (GSD metodolojisi):

| Faz | Açıklama | Durum |
|-----|----------|-------|
| 1 | Finance Modülü → Supabase Migrasyonu | ✅ Tamamlandı |
| 2 | Unified Data Layer (CrossModuleSnapshot) | ✅ Tamamlandı |
| 3 | Rule Engine (7 kural, R1-R7) | ✅ Tamamlandı |
| 4 | Insights Schema + Cron Pipeline | ✅ Tamamlandı |
| 5 | LLM Orchestrator (Narrative Generation) | ✅ Tamamlandı |
| 6 | Intelligence API Routes | ✅ Tamamlandı |
| 7 | Dashboard Intelligence Feed UI | 🔄 Devam ediyor |

---

## Kurulum

### Gereksinimler

- Node.js 18+
- Supabase hesabı
- Anthropic API anahtarı

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Ortam değişkenlerini ayarla

`.env.local.example` dosyasını kopyala ve doldur:

```bash
cp .env.local.example .env.local
```

```env
ANTHROPIC_API_KEY=                    # Claude API anahtarı
NEXT_PUBLIC_SUPABASE_URL=             # Supabase proje URL'si
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=            # Supabase service role (cron/admin için)
GMAIL_CLIENT_ID=                      # Google OAuth client ID
GMAIL_CLIENT_SECRET=                  # Google OAuth secret
GMAIL_REFRESH_TOKEN=                  # Gmail refresh token
RESEND_API_KEY=                       # Resend e-posta servisi
FROM_EMAIL=hiring@yourdomain.com      # Gönderici adresi
CRON_SECRET=                          # Cron job bearer token
EVAL_BATCH_SIZE=10                    # Lead/aday değerlendirme batch boyutu
GOOGLE_MEET_LINK=https://meet.google.com/xxx-xxxx-xxx
```

### 3. Veritabanı şemasını kur

Supabase SQL Editor'da sırayla çalıştır:

```
supabase/migrations/001_initial_schema.sql     # Hiring modülü
supabase/migrations/002_finance_schema.sql     # Finance modülü
supabase/migrations/003_sales_schema.sql       # Sales modülü
supabase/migrations/20260315000000_create_cross_module_insights.sql  # Intelligence tablosu
```

### 4. Geliştirme sunucusunu başlat

```bash
npm run dev
```

---

## Proje Yapısı

```
soloPreneurOS/
├── app/
│   ├── api/
│   │   ├── cron/             # Zamanlanmış job'lar
│   │   ├── intelligence/     # İçgörü API'leri
│   │   ├── finance/          # Finance API'leri
│   │   ├── hiring/           # Hiring API'leri
│   │   └── sales/            # Sales API'leri
│   ├── finance/              # Finance-OS sayfaları
│   ├── hiring/               # Hire-OS sayfaları
│   ├── sales/                # Sales-OS sayfaları
│   └── page.tsx              # Ana dashboard
├── components/               # React bileşenleri (modüle göre gruplu)
├── lib/
│   ├── intelligence/         # Cross-module zeka katmanı
│   │   ├── rules/            # R1-R7 kural implementasyonları
│   │   ├── data-aggregator.ts
│   │   ├── rule-engine.ts
│   │   └── types.ts
│   ├── supabase/             # Client (browser/server/admin)
│   ├── claude-eval.ts        # Hiring değerlendirme promptları
│   ├── claude-sales-eval.ts  # Sales değerlendirme promptları
│   ├── claude-narrative.ts   # Narrative synthesis
│   └── intelligence-pipeline.ts
└── supabase/
    └── migrations/           # SQL şema dosyaları
```

---

## Mimari Kararlar

**İki katmanlı zeka:** Rule engine deterministik ve sıfır API maliyetiyle bilinen örüntüleri yakalar; LLM keşfettiği bağlantıları 2 cümleyle özetler. İkisi birlikte `cross_module_insights` tablosuna yazar.

**Content-addressed insight ID'leri:** Her insight'ın ID'si SHA256(rule_id + tarih). Aynı kural aynı günde her çalıştığında aynı satırı upsert eder — duplicate yok, idempotent cron.

**Üç Supabase client:** Browser (RLS), Server/RSC, Admin (elevated, cron için). Her biri farklı güven seviyesinde.

**AI sınırı:** Yapay zeka öneri üretir, özetler, taslak yazar, skorlar. Otomatik pipeline durumu değiştirmez, e-posta göndermez, aday reddetmez. Tüm AI eylemleri `created_by: "ai"` ile loglanır.

---

## Testler

```bash
npm run test          # Tüm testleri çalıştır
npm run test:watch    # Watch mode
```

Intelligence modülü için kapsamlı unit testler mevcut:
- `lib/intelligence/types.test.ts`
- `lib/intelligence/data-aggregator.test.ts`
- `lib/intelligence/rules/*.test.ts` (R1-R7)

---

## Demo Notu

Bu projeyi klonlayıp çalıştırıyorsan:

- **Hire-OS** en gerçekçi modül — Gmail + Claude + Resend gerçekten çalışıyor
- **Sales-OS** mock data ile çalışıyor, UI tam ama backend kısmi
- **Finance-OS** Supabase bağlı ama bazı veriler localStorage'da
- **Intelligence** cron endpoint'i ile tetiklenebilir, dashboard UI Faz 7'de geliyor

---

## Lisans

MIT
