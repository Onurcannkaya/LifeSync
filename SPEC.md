# LifeSync - Akıllı PWA Asistanı

## Project Overview
- **Project Name**: LifeSync
- **Type**: Progressive Web App (PWA)
- **Core Functionality**: Kişisel ve profesyonel hayatı yöneten, çok kullanıcılı görev ataması yapılabilen sosyal takvim ve görev yönetim sistemi
- **Target Users**: Freelancerlar, küçük ekipler, profesyoneller

## UI/UX Specification

### Layout Structure
- **Mobile-first** tasarım (375px base)
- **Bottom navigation** - 5 ana sekme
- **Responsive breakpoints**: 375px (mobile), 768px (tablet), 1024px (desktop), 1440px (large desktop)
- **Sidebar** (desktop): Sol tarafta genişletilebilir menü

### Visual Design

#### Color Palette (Tailwind 4 inspired)
```
--color-bg-primary: #0f0f12
--color-bg-secondary: #18181b
--color-bg-tertiary: #27272a
--color-bg-card: #1c1c21
--color-bg-hover: #2a2a30

--color-accent-primary: #6366f1 (Indigo)
--color-accent-secondary: #8b5cf6 (Violet)
--color-accent-success: #10b981 (Emerald)
--color-accent-warning: #f59e0b (Amber)
--color-accent-danger: #ef4444 (Red)
--color-accent-info: #06b6d4 (Cyan)

--color-text-primary: #fafafa
--color-text-secondary: #a1a1aa
--color-text-muted: #71717a

--color-border: #3f3f46
--color-border-focus: #6366f1
```

#### Typography
- **Font Family**: 'Outfit' (headings), 'DM Sans' (body)
- **Headings**: 
  - H1: 32px/700
  - H2: 24px/600
  - H3: 18px/600
  - H4: 16px/500
- **Body**: 14px/400
- **Small**: 12px/400

#### Spacing System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

#### Visual Effects
- Border radius: 8px (small), 12px (medium), 16px (large), 24px (xl)
- Box shadows: 
  - sm: 0 1px 2px rgba(0,0,0,0.3)
  - md: 0 4px 12px rgba(0,0,0,0.4)
  - lg: 0 8px 24px rgba(0,0,0,0.5)
- Glassmorphism: backdrop-blur-xl bg-opacity-80
- Gradient accents: linear-gradient(135deg, #6366f1, #8b5cf6)

### Components

#### 1. Navigation
- Bottom tab bar (mobile)
- Sidebar navigation (desktop)
- Active state: Gradient background, scale transform
- Icons: Lucide icons

#### 2. Cards
- Görev kartları, etkinlik kartları, kullanıcı kartları
- Hover: subtle lift + glow effect
- Status indicators (renkli noktalar)

#### 3. Buttons
- Primary: Gradient background
- Secondary: Outlined
- Ghost: Transparent with hover
- Sizes: sm (32px), md (40px), lg (48px)

#### 4. Forms
- Input fields with floating labels
- Custom checkboxes/radios
- Rich text editor for descriptions

#### 5. Modals
- Slide-up on mobile
- Center modal on desktop
- Backdrop blur effect

#### 6. Calendar
- Week/Month/Day views
- Drag & drop support
- Color-coded events by category

## Functionality Specification

### Ana Sekmeler

#### 1. Bugün (Today)
- Günlük özet kartı (toplam görev, tamamlanan, bekleyen)
- Bugünkü görevler listesi (sıralanabilir)
- Hızlı ekleme formu
- Günün alıntısı/widget
- Yaklaşan randevular
- Mini takvim

#### 2. Takvim (Calendar)
- Aylık/Günlük/Haftalık görünümler
- Etkinlik oluşturma/düzenleme
- Renk kategorileri (İş, Kişisel, Aile, Sağlık, Eğitim)
- Çoklu takvim desteği
- Hatırlatıcılar
- Tekrarlayan etkinlikler

#### 3. İş İstasyonu (Workspace)
- Proje listesi
- Kanban görünümü (Yapılacak, Devam Ediyor, İnceleme, Tamamlandı)
- Gorev detay paneli
- Alt görev sistemi
- Etiketler ve öncelikler
- Dosya ekleri (mock)
- Zaman takibi
- İlerleme çubukları

#### 4. Ağım (Network)
- Ekip üyeleri listesi
- Kullanıcı profilleri
- Görev atama sistemi (çoklu kullanıcı)
- Yorumlar ve mention sistemi
- Aktivite akışı
- Çevrimiçi durumu
-Rol bazlı izinler

#### 5. Arşiv (Archive)
- Tamamlanan görevler
- Geçmiş etkinlikler
- Arama ve filtreleme
- Geri yükleme seçeneği
- Silme (kalıcı)

### Ortak Özellikler

#### Görev Sistemi
- Başlık, açıklama, öncelik (Low/Medium/High/Urgent)
- Due date, start date
- Atanan kullanıcılar (çoklu)
- Alt görevler
- Etiketler (çoklu)
- Dosya ekleri
- Yorumlar
- Durum: Todo, In Progress, In Review, Done

#### Etkinlik Sistemi
- Başlık, açıklama, konum
- Başlangıç/bitiş tarihi/saati
- Katılımcılar (çoklu)
- Renk kategorisi
- Tekrar (günlük/haftalık/aylık/yıllık)
- Hatırlatıcılar

#### Kullanıcı Sistemi
- Profil fotoğrafı, ad, rol
- Çevrimiçi/dışında/meşgul durumu
- Bildirimler

### Data Handling
- LocalStorage ile veri yönetimi
- Mock veri ile başlangıç
- State yönetimi ( vanilla JS)

### Edge Cases
- Boş state'ler için placeholder'lar
- Loading durumları
- Form validation
- Hata mesajları

## Acceptance Criteria

### Visual Checkpoints
- [ ] Dark theme başarıyla uygulandı
- [ ] Tüm sekmeler arası geçiş animasyonlu
- [ ] Kart hover efektleri çalışıyor
- [ ] Responsive tasarım tüm breakpoint'lerde çalışıyor
- [ ] Modal ve dropdown'lar doğru çalışıyor

### Functional Checkpoints
- [ ] Görev oluşturma/düzenleme/silme
- [ ] Etkinlik oluşturma/düzenleme/silme
- [ ] Çoklu kullanıcı atama
- [ ] Kanban sürükle-bırak (mock)
- [ ] Arama ve filtreleme
- [ ] LocalStorage persistence
- [ ] PWA manifest ve service worker
