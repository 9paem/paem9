import json

teror_questions = [
  {
    "id": "teror-001",
    "order": 1,
    "topic": "Terörizmin Temel Kavramları",
    "difficulty": "Kolay",
    "text": "Bir örgütün ideolojik amaçlarına ulaşmak için planlı ve sistemli bir şekilde, toplumda korku ve dehşet yaratarak devletin veya anayasal düzenin otoritesini zayıflatmayı amaçlayan şiddet eylemlerine ne ad verilir?",
    "correctOptionId": "b",
    "explanation": "Terörizm, siyasi, dini veya ideolojik amaçlara ulaşmak için toplumda sistemli bir korku, panik ve yıldırma yaratmayı hedefleyen planlı şiddet eylemleridir.",
    "options": [
      {"id": "a", "text": "Organize Suçlar"},
      {"id": "b", "text": "Terörizm"},
      {"id": "c", "text": "Vandalizm"},
      {"id": "d", "text": "Casusluk"},
      {"id": "e", "text": "Sabotaj"}
    ]
  },
  {
    "id": "teror-002",
    "order": 2,
    "topic": "Terör Örgütü Unsurları",
    "difficulty": "Orta",
    "text": "3713 sayılı Terörle Mücadele Kanunu'na göre bir yapılanmanın 'Terör Örgütü' sayılabilmesi için bulunması gereken temel unsurlar aşağıdakilerden hangisidir?",
    "correctOptionId": "c",
    "explanation": "3713 sayılı kanuna göre terör örgütlerinin temel unsurları; siyasi veya ideolojik bir amaç, cebir ve şiddet kullanımı ve bu amaca yönelik hiyerarşik bir örgütlenmenin varlığıdır.",
    "options": [
      {"id": "a", "text": "Finansal güç, silah ve medya desteği"},
      {"id": "b", "text": "Sadece uluslararası bağlantı ve gizlilik"},
      {"id": "c", "text": "İdeolojik amaç, örgütlenme (hiyerarşi) ve cebir/şiddet kullanımı"},
      {"id": "d", "text": "Kar amacı gütme ve ticari faaliyetler"},
      {"id": "e", "text": "Siber saldırı yeteneği ve yabancı dil bilgisi"}
    ]
  },
  {
    "id": "teror-003",
    "order": 3,
    "topic": "Terörizme Karşı Koyma Stratejisi",
    "difficulty": "Orta",
    "text": "Güvenlik güçleri tarafından terör olaylarını ve saldırılarını önlemek amacıyla proaktif (önleyici) olarak yürütülen, istihbarata dayalı tüm operasyonel çalışmalara verilen genel ad nedir?",
    "correctOptionId": "d",
    "explanation": "Terörle mücadelede saldırılar gerçekleşmeden önce istihbarat ve operasyonel tedbirlerle terör unsurlarını etkisiz hale getirmeye yönelik çalışmalara 'Önleyici (Proaktif) Mücadele' adı verilir.",
    "options": [
      {"id": "a", "text": "Pasif Koruma"},
      {"id": "b", "text": "Reaktif Müdahale"},
      {"id": "c", "text": "Adli Soruşturma"},
      {"id": "d", "text": "Proaktif (Önleyici) Mücadele"},
      {"id": "e", "text": "Kriz Yönetimi"}
    ]
  },
  {
    "id": "teror-004",
    "order": 4,
    "topic": "Patlayıcılar ve Bombalı Eylemler",
    "difficulty": "Zor",
    "text": "Terör örgütlerinin bombalı eylemlerinde sıklıkla başvurdukları 'İkincil Bomba (Secondary Device)' taktiğinin temel amacı aşağıdakilerden hangisidir?",
    "correctOptionId": "a",
    "explanation": "İkincil bomba (secondary device) taktiği; ilk patlamanın ardından olay yerine müdahale etmek için gelen sağlık, itfaiye ve güvenlik ekiplerini (ilk müdahale ekiplerini) hedef alarak can kaybını maksimize etmeyi amaçlar.",
    "options": [
      {"id": "a", "text": "Olay yerine yardıma gelen ilk müdahale ekiplerini ve güvenlik güçlerini hedef almak"},
      {"id": "b", "text": "Sadece maddi hasarı artırarak bina kolonlarını yıkmak"},
      {"id": "c", "text": "Birinci bombanın patlamama ihtimaline karşı yedek olarak kullanmak"},
      {"id": "d", "text": "Bomba imha uzmanlarının çalışmasını kolaylaştırmak"},
      {"id": "e", "text": "Saldırının uluslararası basında duyulmasını sağlamak"}
    ]
  },
  {
    "id": "teror-005",
    "order": 5,
    "topic": "Canlı Bomba Profili",
    "difficulty": "Orta",
    "text": "Şüpheli bir şahsın 'Canlı Bomba (İntihar Saldırganı)' olabileceğine dair güvenlik güçlerini alarma geçirmesi gereken en kritik davranışsal ve fiziksel belirti aşağıdakilerden hangisidir?",
    "correctOptionId": "c",
    "explanation": "Canlı bombaların en belirgin özellikleri arasında mevsime veya hava durumuna uygun olmayan kalın, bol kıyafetler giymeleri, gergin olmaları, aşırı terlemeleri ve odaklanmış, tünel vizyonu (hedefe kilitlenme) sergilemeleridir.",
    "options": [
      {"id": "a", "text": "Açık renkli ve dar kıyafetler giymesi"},
      {"id": "b", "text": "Sürekli telefonla yüksek sesle konuşması"},
      {"id": "c", "text": "Mevsime uygun olmayan bol, kalın kıyafetler giymesi ve hedefe kilitlenmiş (tünel vizyonu) gergin tavırlar sergilemesi"},
      {"id": "d", "text": "Çevresindeki insanlarla sürekli sohbet etmeye çalışması"},
      {"id": "e", "text": "Toplu taşıma araçlarında sadece en arka koltukta oturması"}
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
data['metadata']['questionBankVersion'] = 'v7'

with open('data/firestore-seed.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Terör questions added")
