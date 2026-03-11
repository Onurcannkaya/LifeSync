# LifeSync V2 - Akıllı PWA Asistanı

Modern, hızlı ve profesyonel kişisel asistan uygulaması. Takvim, görev yönetimi, kanban panosu ve ekip ağı (social network) özellikleri tek bir platformda buluşuyor. 

Projenin **V2 versiyonunda** yerel prototipten çıkılmış; **Supabase, OneSignal, Vite ve PWA (Service Worker)** entegrasyonlarıyla tam teşekküllü ve yayına hazır bir Production uygulamasına dönüşmüştür.

---

## 🚀 Öne Çıkan Özellikler

- **Modüler Mimari**: Vite ile derlenen, temiz ve modüler Vanilla JS altyapısı.
- **Gerçek Veritabanı & Kimlik Doğrulama**: Supabase Auth (E-posta/Şifre) ve PostgreSQL CRUD işlemleri.
- **Güvenlik (RLS)**: Her kullanıcı sadece kendi görev ve etkinliklerini görebilir (Row Level Security).
- **Sosyal Ağ ("Ağ" Sekmesi)**: Arkadaş ekleme, onaylama, reddetme mekanizması ve canlı arkadaş listesi.
- **Push Bildirimler**: OneSignal REST API entegrasyonu ile gerçek zamanlı bildirim gönderimi.
- **PWA (Progressive Web App)**: 
  - `sw.js` (Service Worker) ve Cache First stratejisi ile çevrimdışı (offline) çalışma.
  - Mobil cihazlarda ana ekrana "App" olarak eklenebilme (72px - 512px icon seti).
- **Kullanıcı Deneyimi (UX)**: 
  - Gelişmiş "Splash Screen" (Yükleme Ekranı).
  - Modern, karanlık tema ağırlıklı cam (glassmorphism) tasarımı.
  - Klavye Kısayolları (Ctrl+K, Ctrl+N vb.).

---

## 🛠️ Kurulum ve Geliştirme

Projeyi yerel ortamınızda ayağa kaldırmak için aşağıdaki adımları izleyin.

### 1. Bağımlılıkların Kurulması
```bash
git clone https://github.com/Onurcannkaya/LifeSync.git
cd LifeSync
npm install
```

### 2. Ortam Değişkenleri (.env)
Proje kök dizininde bulunan `.env.example` dosyasını kopyalayarak `.env` adında yeni bir dosya oluşturun:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

VITE_ONESIGNAL_APP_ID=your_onesignal_app_id
VITE_ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key
```

### 3. Supabase Veritabanı Hazırlığı
Supabase SQL Editor üzerinden aşağıdaki SQL komutlarını çalıştırarak tabloları oluşturun:

1. `supabase-schema.sql` (Görev, Etkinlik, Proje tabloları ve RLS politikaları)
2. `supabase-faz1-trigger.sql` (Yeni kullanıcı kayıt olduğunda `public.users` tablosunu besleyen otomatik Trigger)

### 4. Geliştirme Sunucusunu Başlatma
```bash
npm run dev
```
Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

---

## 📦 Üretim (Production) Derlemesi

Uygulamayı Vercel, Netlify veya Render.com gibi bir sunucuya yüklemeden önce üretim paketini (build) oluşturmak için:

```bash
npm run build
```

Bu komut:
1. Tüm CSS/JS dosyalarını küçültür (minify).
2. Kaynak haritalarını (sourcemaps) kapatır.
3. `sw.js` ve manifest dosyalarını `dist/` klasörüne kopyalar.

Derlenen projeyi yerelde test etmek için:
```bash
npx serve dist
```

---

## 🗂️ Proje Yapısı

```
├── src/
│   ├── css/            # Modüler CSS dosyaları (auth.css, layout.css, modals.css)
│   ├── js/
│   │   ├── render/     # Uİ bileşenlerini çizen modüller (today, calendar, network vb.)
│   │   ├── utils/      # Supabase, OneSignal, Store ve ErrorHandler servisleri
│   │   └── app.js      # Ana uygulama döngüsü ve başlatıcı (entry-point)
│   ├── sw.js           # PWA Service Worker (Offline Cache)
│   └── index.html      # Ana HTML çerçevesi ve Splash Screen
├── dist/               # Derlenmiş (Build) çıktı klasörü
├── .env                # Gizli API Anahtarları (Git'e yüklenmez)
├── vite.config.js      # Vite Derleme Ayarları
└── supabase-schema.sql # Veritabanı Tablo ve Yetki Şemaları
```

---

## 📋 Lisans

**Proje Sahibi:** Onurcan KAYA
