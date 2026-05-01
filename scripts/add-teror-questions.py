import json

new_questions = [
  {
    "id": "teror-001",
    "order": 1,
    "topic": "Koruma İlkeleri",
    "difficulty": "Kolay",
    "text": "Aşağıdakilerden hangisi korumanın ana unsurlarından değildir?",
    "correctOptionId": "e",
    "explanation": "Özel Koruma, korumanın temel unsurlarından (Yaya, Motorize, Bina/Tesis, Öncü İstihbarat) biri değildir.",
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
    "difficulty": "Orta",
    "text": "Risk analizinin aşamaları sıralı şekilde doğru verilmiştir.",
    "correctOptionId": "a",
    "explanation": "Risk analizinde sırasıyla riskler tespit edilir, derecelendirilir ve ardından bu riskler örtülür (giderilir/kontrol altına alınır).",
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
    "difficulty": "Kolay",
    "text": "Aşağıdakilerden hangisi tesis korumanın temel prensiplerinden biri değildir?",
    "correctOptionId": "c",
    "explanation": "Tesis korumada ülkenin itibarı, ekonomiye katkısı, çalışan güvenliği ve halkın huzuru esastır. 'Kişinin itibarı' özel (yakın) korumanın prensiplerinden biri olabilir ancak tesis korumanın temel prensibi değildir.",
    "options": [
      {"id": "a", "text": "Ülkenin itibarı"},
      {"id": "b", "text": "Ülke Ekonomisine Katkısı"},
      {"id": "c", "text": "Kişinin itibarı"},
      {"id": "d", "text": "Çalışanların faaliyetini güvenli ortamda gerçekleştirilmesi"},
      {"id": "e", "text": "Halkın huzuru ve istirahati"}
    ]
  },
  {
    "id": "teror-004",
    "order": 4,
    "topic": "Risk Analizi",
    "difficulty": "Kolay",
    "text": "Korunacak yerde yapılan incelemeler neticesinde kurumun yaptığı iş, stratejik ve coğrafi konumu göz önünde bulundurularak risklerin tespit edilmesi ve önemine göre derecelendirilmesine ........... .......... denir.",
    "correctOptionId": "b",
    "explanation": "Risk analizi; bir tesisin veya hedefin maruz kalabileceği tehditlerin belirlenmesi ve bunların derecelendirilmesi işlemidir.",
    "options": [
      {"id": "a", "text": "VIP Koruma"},
      {"id": "b", "text": "Risk Analizi"},
      {"id": "c", "text": "Ekonomik maliyet analizi"},
      {"id": "d", "text": "Araştırma Analiz"},
      {"id": "e", "text": "Güvenlik Analizi"}
    ]
  },
  {
    "id": "teror-005",
    "order": 5,
    "topic": "Kişisel Güvenlik",
    "difficulty": "Kolay",
    "text": "Aşağıdakilerden hangisi kişisel güvenlik ilkelerinden değildir?",
    "correctOptionId": "d",
    "explanation": "Kişisel güvenlikte gizliliğe (mahremiyet ve operasyonel bilgi güvenliğine) riayet etmek şarttır. 'Gizliliğe riayet etmemek' güvenlik zafiyeti yaratır.",
    "options": [
      {"id": "a", "text": "Rutin işlerden kaçınmak"},
      {"id": "b", "text": "Uyanık ve şüpheci olmak"},
      {"id": "c", "text": "Sistemli Olmak"},
      {"id": "d", "text": "Gizliliğe riayet etmemek"},
      {"id": "e", "text": "Girişimci ve sağduyulu olmak"}
    ]
  }
]

def main():
    with open('data/firestore-seed.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for session in data.get('sessions', []):
        for course in session.get('courses', []):
            if course.get('id') == 'tesis-koruma':
                # Preserve any existing questions and append the new ones? 
                # The user said "bu 5 soruyu Terörizme Karşı Koyma dersine ekle".
                # Currently, it has 0 questions.
                course['questions'] = new_questions
                break
                
    if 'metadata' not in data:
        data['metadata'] = {}
    data['metadata']['questionBankVersion'] = 'v7'
    
    with open('data/firestore-seed.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
