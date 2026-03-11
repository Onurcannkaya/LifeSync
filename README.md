# LifeSync - Akıllı PWA Asistanı

Modern, hızlı ve profesyonel kişisel asistan uygulaması. Takvim, görev yönetimi, kanban panosu ve ekip ağı özellikleri tek uygulamada.

## 🚀 Özellikler

- **5 Ana Sekme**: Bugün, Takvim, Workspace (Kanban), Ağ, Arşiv
- **Görev Yönetimi**: Proje bazlı, etiketler, öncelikler
- **Takvim**: Gün/Hafta/Ay görünümleri, etkinlikler
- **Kanban Panosu**: Sürükle-bırak ile görev yönetimi
- **Ekip Ağı**: Takım üyeleri ile işbirliği
- **PWA**: Yükleyebilir, çevrimdışı çalışır
- **Bildirimler**: Tarayıcı + OneSignal push bildirimleri
- **Karanlık Mod**: Gece kullanımı için
- **Klavye Kısayolları**: Ctrl+K (ara), Ctrl+N (yeni görev), Ctrl+E (yeni etkinlik), Ctrl+D (karanlık mod)

## 🛠️ Kurulum

### 1. Projeyi İndir
```bash
git clone <repo-url>
cd lifesync
```

### 2. Supabase Kurulumu (Veritabanı)
1. https://supabase.com adresinden ücretsiz hesap oluşturun
2. Yeni proje oluşturun
3. SQL Editor'de aşağıdaki tabloları oluşturun:

```sql
-- Users tablosu
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks tablosu
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  project TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMP,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events tablosu
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  color TEXT,
  attendees TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. OneSignal Kurulumu (Bildirimler)
1. https://onesignal.com adresinden ücretsiz hesap oluşturun
2. Yeni uygulama oluşturun (Web Push)
3. **Önemli**: Uygulamayı yayına alın (Go Live)
4. App ID'yi alın ve `app.js` dosyasındaki `ONESIGNAL_APP_ID` kısmına ekleyin

### 4. Vercel Deployment
```bash
npm i -g vercel
vercel --prod
```

Veya GitHub'a yükleyip Vercel'den import edin.

## 📱 Kullanım

- **Ctrl+K**: Hızlı arama
- **Ctrl+N**: Yeni görev
- **Ctrl+E**: Yeni etkinlik
- **Ctrl+D**: Karanlık mod toggle
- **Ctrl+1-5**: Sekmeler arası geçiş

## 🗂️ Proje Yapısı

```
├── index.html      # Ana HTML yapısı
├── styles.css      # CSS stiller (cyan/blue tema)
├── app.js          # JavaScript uygulaması
├── manifest.json   # PWA manifest
├── sw.js          # Service Worker
├── README.md      # Bu dosya
└── INSTRUCTION.md # Detaylı kullanım kılavuzu
```

## 📋 Lisans

Onurcan KAYA
