# PAEM Sınav Hazırlık

GitHub Pages üzerinde yayınlanabilecek statik sınav hazırlık uygulaması.

## Yapı

- `index.html`: Giriş ve soru çözme ekranı
- `styles.css`: Responsive arayüz stilleri
- `app.js`: Firebase Auth, statik soru bankası okuma, yerel cevap cache'i ve seyrek skor kaydı akışı
- `firebase-config.js`: Firebase proje ayarları
- `data/sample-questions.js`: Firebase bağlanmadan çalışmak için demo veri
- `data/firestore-seed.json`: Firestore'a girilecek oturum ve ders başlangıç verisi
- `scripts/seed-firestore.mjs`: Firestore'a tek seferlik veri yükleme scripti (local)
- `firestore.rules`: Firestore güvenlik kuralları

## Firestore Veri Modeli

```text
sessions/{sessionId}
  title: "Oturum 1"
  order: 1

sessions/{sessionId}/courses/{courseId}
  title: "Anayasa Hukuku"
  order: 1
  questionShare: "%20"

sessions/{sessionId}/courses/{courseId}/questions/{questionId}
  order: 1
  topic: "Temel Kavramlar"
  difficulty: "Orta"
  text: "Soru metni"
  correctOptionId: "b"
  explanation: "Kısa açıklama"
  options: [
    { id: "a", text: "..." },
    { id: "b", text: "..." },
    { id: "c", text: "..." },
    { id: "d", text: "..." },
    { id: "e", text: "..." }
  ]

users/{uid}/courseScores/{courseId}
  best: 12
  updatedAt: serverTimestamp()

users/{uid}
  displayName: "..."
  email: "..."
  totalPoints: 120
```

Not: Soru cevapları Firestore'a soru başına yazılmaz; tarayıcıdaki yerel cache'te tutulur. Soru bankası önce `data/firestore-seed.json` statik dosyasından yüklenir, Firestore içerik okuması yalnızca bu dosya yüklenemezse yedek olarak kullanılır. Sunucu maliyetini düşük tutmak için Firestore'a yalnızca test bitince yerel en iyi skor iyileşirse skor yazılır.

## Kurulum

1. Firebase Console'da proje oluştur.
2. Authentication > Sign-in method bölümünden Email/Password sağlayıcısını aç.
3. Firestore Database oluştur.
4. `firebase-config.js` içindeki değerleri Firebase web app ayarlarınla değiştir.
5. `firestore.rules` dosyasındaki kuralları Firebase Console > Firestore Rules alanına yükle.
6. GitHub reposunda Settings > Pages bölümünden branch olarak `main`, klasör olarak `/root` seç.

## Soru Ekleme Süreci

Örnek soruları metin olarak gönderdiğinde şu yapıya dönüştüreceğim:

- soru metni
- beş şık
- doğru cevap
- konu
- ders
- oturum
- varsa açıklama

Sonra bu verileri Firestore'a aktarılacak JSON halinde ekleriz.
