import json

teror_questions = [
  {
    "id": "teror-001",
    "order": 1,
    "topic": "Korumanın Ana Unsurları",
    "difficulty": "Orta",
    "text": "Aşağıdakilerden hangisi korumanın ana unsurlarından değildir?",
    "correctOptionId": "e",
    "explanation": "Özel Koruma, korumanın genel ve ana unsurlarından (Yaya, Motorize, Bina/Tesis ve Öncü İstihbarat) biri değildir.",
    "options": [
      {"id": "a", "text": "Yaya Koruma"},
      {"id": "b", "text": "Motorize Koruma"},
      {"id": "c", "text": "Bina Tesis Koruma"},
      {"id": "d", "text": "Öncü İstihbarat"},
      {"id": "e", "text": "Özel Koruma"}
    ]
  },
  {
    "id": "teror-002",
    "order": 2,
    "topic": "Risk Analizi",
    "difficulty": "Kolay",
    "text": "Risk analizinin aşamaları sıralı şekilde doğru verilmiştir.",
    "correctOptionId": "a",
    "explanation": "Risk analizi süreci; risklerin tespit edilmesi, bunların önemine göre derecelendirilmesi ve son olarak alınacak önlemlerle örtülmesi (minimize edilmesi) aşamalarından oluşur.",
    "options": [
      {"id": "a", "text": "Risklerin Tespit Edilmesi - Risklerin Derecelendirilmesi - Risklerin Örtülmesi"},
      {"id": "b", "text": "Risklerin Derecelendirilmesi - Risklerin Tespit Edilmesi - Risklerin Örtülmesi"},
      {"id": "c", "text": "Risklerin Örtülmesi - Risklerin Derecelendirilmesi - Risklerin Tespit Edilmesi"},
      {"id": "d", "text": "Risklerin Derecelendirilmesi - Risklerin Örtülmesi - Risklerin Tespit Edilmesi"},
      {"id": "e", "text": "Risklerin Örtülmesi - Risklerin Derecelendirilmesi - Risklerin Tespit Edilmesi"}
    ]
  },
  {
    "id": "teror-003",
    "order": 3,
    "topic": "Tesis Koruma Prensipleri",
    "difficulty": "Orta",
    "text": "Aşağıdakilerden hangisi tesis korumanın temel prensiplerinden biri değildir?",
    "correctOptionId": "c",
    "explanation": "Kişinin itibarı, daha çok VIP korumanın konusu iken tesis koruma ülkenin itibarı, ekonomi, çalışanların güvenliği gibi konulara odaklanır.",
    "options": [
      {"id": "a", "text": "Ülkenin itibar"},
      {"id": "b", "text": "Ülke Ekonomisine Katkısı"},
      {"id": "c", "text": "Kişinin itibarı"},
      {"id": "d", "text": "Çalışanların faaliyetini güvenli ortamda gerçekleştirilmesi"},
      {"id": "e", "text": "Halkın huzuru ve istirahati"}
    ]
  },
  {
    "id": "teror-004",
    "order": 4,
    "topic": "Risk Analizi Tanımı",
    "difficulty": "Kolay",
    "text": "Korunacak yerde yapılan incelemeler neticesinde kurumun yaptığı iş, stratejik ve coğrafi konumu göz önünde bulundurularak risklerin tespit edilmesi ve önemine göre derecelendirilmesine .......... denir.",
    "correctOptionId": "b",
    "explanation": "Bu süreç, tehlikelerin saptanması ve risk boyutunun değerlendirildiği temel güvenlik prosedürü olan Risk Analizidir.",
    "options": [
      {"id": "a", "text": "VIP Koruma"},
      {"id": "b", "text": "Risk Analiz"},
      {"id": "c", "text": "Ekonomik maliyet analizi"},
      {"id": "d", "text": "Araştırma Analiz"},
      {"id": "e", "text": "Güvenlik Analizi"}
    ]
  },
  {
    "id": "teror-005",
    "order": 5,
    "topic": "Kişisel Güvenlik İlkeleri",
    "difficulty": "Kolay",
    "text": "Aşağıdakilerden hangisi kişisel güvenlik ilkelerinden değildir.",
    "correctOptionId": "d",
    "explanation": "Kişisel güvenlikte gizliliğe riayet etmemek büyük bir güvenlik zafiyetidir. Dolayısıyla gizliliğe riayet etmek temel bir ilkedir.",
    "options": [
      {"id": "a", "text": "Rutin işlerden kaçınmak"},
      {"id": "b", "text": "Uyanık ve şüpheci olmak"},
      {"id": "c", "text": "Sistemli olmak"},
      {"id": "d", "text": "Gizliliğe riayet etmemek"},
      {"id": "e", "text": "Girişimci ve sağduyulu olmak"}
    ]
  }
]

with open('data/firestore-seed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for session in data.get('sessions', []):
    for course in session.get('courses', []):
        if course.get('id') == 'tesis-koruma':
            course['questions'] = teror_questions
            break

if 'metadata' not in data:
    data['metadata'] = {}
data['metadata']['questionBankVersion'] = 'v8'

with open('data/firestore-seed.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("New 5 questions replaced")
