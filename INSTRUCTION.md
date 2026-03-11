# LifeSync Kullanım Kılavuzu

## Başlangıç

LifeSync'i kullanmak için önce kayıt olmanız veya giriş yapmanız gerekir. Demo mod ile kayıt olmadan deneyebilirsiniz.

## Ana Ekran

### Sekmeler
1. **Bugün** - Bugünkü görevler ve etkinlikler
2. **Takvim** - Takvim görünümü (Gün/Hafta/Ay)
3. **Workspace** - Kanban panosu ve proje yönetimi
4. **Ağ** - Ekip üyeleri ve iletişim
5. **Arşiv** - Tamamlanmış görevler ve eski etkinlikler

## Görev Yönetimi

### Yeni Görev Ekleme
- **Hızlı**: Ctrl+N kısayolu veya + butonu
- **Detaylı**: Herhangi bir sekmede sağ alttaki FAB butonu

### Görev Özellikleri
- **Başlık**: Görevin adı
- **Açıklama**: Detaylı bilgi
- **Proje**: Görevin ait olduğu proje
- **Öncelik**: Düşük (yeşil), Orta (sarı), Yüksek (kırmızı)
- **Bitiş Tarihi**: Görevin tamamlanması gereken tarih
- **Etiketler**: Görevi kategorize etmek için

### Kanban Panosu (Workspace)
- Sürükle-bırak ile görevleri taşıyın
- Sütunlar: Yapılacak, Devam Ediyor, Tamamlandı
- Her sütunda görevleri öncelik sırasına göre görüntüle

## Takvim

### Görünümler
- **Gün**: Tek günlük görünüm
- **Hafta**: 7 günlük görünüm
- **Ay**: Aylık takvim görünümü

### Etkinlikler
- Etkinlik oluşturmak için takvime tıklayın veya Ctrl+E
- Başlangıç ve bitiş saati belirleyin
- Renk seçimi yapın
- Katılımcı ekleyin (e-posta ile)

## Ekip Ağı

### Üye Ekleme
- Ağ sekmesinden yeni üye ekleyin
- İsim ve e-posta girin
- Avatar otomatik oluşturulur

### İşbirliği
- Görevleri ekip üyelerine atayın
- Etkinliklere katılımcı ekleyin

## Bildirimler

### Tarayıcı Bildirimleri
- Tarayıcı izin verdiğinde otomatik çalışır
- Etkinliklerden 15 dakika ve 1 dakika önce uyarır

### OneSignal Bildirimleri
- Uygulama yayına alındıktan sonra App ID ekleyin
- Push bildirimleri için gerekli

## Klavye Kısayolları

| Kısayol | İşlev |
|---------|-------|
| Ctrl+K | Arama |
| Ctrl+N | Yeni görev |
| Ctrl+E | Yeni etkinlik |
| Ctrl+D | Karanlık mod |
| Ctrl+1 | Bugün sekmesi |
| Ctrl+2 | Takvim sekmesi |
| Ctrl+3 | Workspace sekmesi |
| Ctrl+4 | Ağ sekmesi |
| Ctrl+5 | Arşiv sekmesi |

## PWA Kurulumu

### Chrome/Edge
1. Sağ üstteki yükleme ikonuna tıklayın
2. "Yükle" seçeneğini seçin

### Safari (iOS)
1. Paylaş butonuna tıklayın
2. "Ekleme" seçeneğini seçin

## Veri Yönetimi

### Yerel Depolama
- Tüm veriler tarayıcıda localStorage'da saklanır
- Verileri dışa aktarabilir veya silebilirsiniz

### Supabase (Bulut)
- Supabase projenizi oluşturun
- SQL tablolarını çalıştırın
- `app.js` dosyasında CONFIG bölümünü güncelleyin

## Sorun Giderme

### Bildirimler Çalışmıyor
1. Tarayıcı ayarlarından bildirim izni verin
2. OneSignal App ID'yi kontrol edin

### PWA Yüklenemiyor
1. HTTPS kullanın (Vercel otomatik sağlar)
2. Service worker'ı devre dışı bırakıp tekrar deneyin

### Veriler Kayboldu
- localStorage temizlenmiş olabilir
- Bulut yedekleme için Supabase'i aktifleştirin
