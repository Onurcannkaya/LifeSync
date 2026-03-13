-- LifeSync - Test Verilerini Temizleme SQL Betiği
-- Bu kodları Supabase panosundaki 'SQL Editor' kısmına yapıştırıp çalıştırabilirsiniz.
-- UYARI: Bu işlem geri alınamaz. Eğer sadece kendi testlerinizi silmek istiyorsanız
-- aşağıdaki UUID kısmına kendi kullanıcı id'nizi yazın. Veya tümünü silmek istiyorsanız
-- WHERE kısımlarını silebilirsiniz.

-- 1. Tüm Görevleri (Tasks) Silmek İçin (Eğer tabloları tamamen sıfırlamak isterseniz)
TRUNCATE TABLE tasks CASCADE;

-- 2. Tüm Etkinlikleri (Events) Silmek İçin
TRUNCATE TABLE events CASCADE;

-- --- VEYA SADECE BELLİ KULLANICININ VERİLERİNİ SİLMEK İÇİN YÖNTEM --- --
-- (Üstteki TRUNCATE satırlarını silip sadece aşağıdakileri çalıştırabilirsiniz)

-- DELETE FROM tasks WHERE user_id = 'YOUR-UUID-HERE';
-- DELETE FROM events WHERE user_id = 'YOUR-UUID-HERE';
-- DELETE FROM projects WHERE user_id = 'YOUR-UUID-HERE';
