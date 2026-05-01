import json
import re

new_questions = [
  {
    "id": "narkotik-001",
    "order": 1,
    "topic": "TCK 188 - İmal ve Ticaret",
    "difficulty": "Kolay",
    "text": "TCK Madde 188'e göre uyuşturucu veya uyarıcı madde imal ve ticareti suçunu ruhsatsız veya ruhsata aykırı olarak işleyen kişiye verilecek temel ceza türü aşağıdakilerden hangisidir?",
    "correctOptionId": "c",
    "explanation": "TCK Madde 188/1'e göre uyuşturucu veya uyarıcı maddeleri ruhsatsız veya ruhsata aykırı olarak imal, ithal veya ihraç eden kişi hapis ve adlî para cezası ile cezalandırılır.",
    "options": [
      {"id": "a", "text": "Yalnızca hapis cezası"},
      {"id": "b", "text": "Yalnızca adlî para cezası"},
      {"id": "c", "text": "Hapis cezası ve adlî para cezası"},
      {"id": "d", "text": "Müsadere ve kamu hizmetinden men"},
      {"id": "e", "text": "Denetimli serbestlik"}
    ]
  },
  {
    "id": "narkotik-002",
    "order": 2,
    "topic": "TCK 188 - Nitelikli Haller",
    "difficulty": "Orta",
    "text": "TCK Madde 188 kapsamında, uyuşturucu madde ticareti suçunun aşağıdaki yerlerden hangisinin yakınında işlenmesi verilecek cezanın yarı oranında artırılmasını gerektirir?",
    "correctOptionId": "b",
    "explanation": "TCK Madde 188/4-b'ye göre suçun okul, yurt, hastane, kışla veya ibadethane gibi tedavi, eğitim, askerî ve sosyal amaçla toplu bulunulan bina ve tesisler ile bunların çevrelerinde işlenmesi nitelikli haldir.",
    "options": [
      {"id": "a", "text": "Alışveriş merkezleri"},
      {"id": "b", "text": "Okul, yurt veya ibadethaneler"},
      {"id": "c", "text": "Eğlence mekanları"},
      {"id": "d", "text": "Sanayi bölgeleri"},
      {"id": "e", "text": "Spor salonları"}
    ]
  },
  {
    "id": "narkotik-003",
    "order": 3,
    "topic": "TCK 188 - Yaş Küçüklüğü",
    "difficulty": "Zor",
    "text": "TCK 188'e göre uyuşturucu madde satışının çocuklara yapılması durumunda verilecek hapis cezasının alt sınırı nedir?",
    "correctOptionId": "d",
    "explanation": "TCK Madde 188/3'e göre uyuşturucu veya uyarıcı maddeleri çocuklara veren veya satan kişiye verilecek hapis cezası on beş yıldan az olamaz.",
    "options": [
      {"id": "a", "text": "Beş yıldan az olamaz"},
      {"id": "b", "text": "Sekiz yıldan az olamaz"},
      {"id": "c", "text": "On yıldan az olamaz"},
      {"id": "d", "text": "On beş yıldan az olamaz"},
      {"id": "e", "text": "Yirmi yıldan az olamaz"}
    ]
  },
  {
    "id": "narkotik-004",
    "order": 4,
    "topic": "TCK 188 - İmal ve Ticaret",
    "difficulty": "Orta",
    "text": "Uyuşturucu madde ticaretinin bir örgütün faaliyeti çerçevesinde işlenmesi halinde ceza artırım oranı nedir?",
    "correctOptionId": "a",
    "explanation": "TCK Madde 188/5'e göre suçun bir örgütün faaliyeti çerçevesinde işlenmesi halinde, verilecek ceza yarı oranında artırılır.",
    "options": [
      {"id": "a", "text": "Yarı oranında artırılır"},
      {"id": "b", "text": "Bir kat artırılır"},
      {"id": "c", "text": "İki kat artırılır"},
      {"id": "d", "text": "Üçte bir oranında artırılır"},
      {"id": "e", "text": "Dörtte bir oranında artırılır"}
    ]
  },
  {
    "id": "narkotik-005",
    "order": 5,
    "topic": "TCK 188 - Etkin Pişmanlık",
    "difficulty": "Orta",
    "text": "Uyuşturucu madde ticareti suçuna iştirak eden kişinin resmi makamlar tarafından haber alınmadan önce diğer suç ortaklarını bildirmesi durumunda TCK 192'ye göre uygulanacak indirim aşağıdakilerden hangisidir?",
    "correctOptionId": "e",
    "explanation": "TCK 192/1'e göre resmi makamlar tarafından haber alınmadan önce durumu fail veya suç ortaklarını haber verip yakalanmalarını sağlayan kişiye ceza verilmez.",
    "options": [
      {"id": "a", "text": "Cezası yarı oranında indirilir"},
      {"id": "b", "text": "Cezası üçte bir oranında indirilir"},
      {"id": "c", "text": "Sadece para cezası verilir"},
      {"id": "d", "text": "Hükmün açıklanmasının geri bırakılması kararı verilir"},
      {"id": "e", "text": "Ceza verilmez"}
    ]
  },
  {
    "id": "narkotik-006",
    "order": 6,
    "topic": "TCK 191 - Kullanmak İçin Bulundurma",
    "difficulty": "Kolay",
    "text": "TCK Madde 191'e göre, sadece kullanmak için uyuşturucu veya uyarıcı madde satın alan, kabul eden veya bulunduran kişiye verilecek hapis cezasının alt ve üst sınırı nedir?",
    "correctOptionId": "b",
    "explanation": "TCK Madde 191/1'e göre kullanmak için uyuşturucu veya uyarıcı madde satın alan, kabul eden veya bulunduran kişi iki yıldan beş yıla kadar hapis cezası ile cezalandırılır.",
    "options": [
      {"id": "a", "text": "Bir yıldan üç yıla kadar"},
      {"id": "b", "text": "İki yıldan beş yıla kadar"},
      {"id": "c", "text": "Üç yıldan yedi yıla kadar"},
      {"id": "d", "text": "Beş yıldan on yıla kadar"},
      {"id": "e", "text": "Altı aydan iki yıla kadar"}
    ]
  },
  {
    "id": "narkotik-007",
    "order": 7,
    "topic": "TCK 191 - Kamu Davasının Ertelenmesi",
    "difficulty": "Zor",
    "text": "TCK Madde 191/2 uyarınca, uyuşturucu kullanmak amacıyla bulundurma suçundan dolayı başlatılan soruşturmada Cumhuriyet savcısı tarafından hangi karar verilir?",
    "correctOptionId": "c",
    "explanation": "TCK 191/2 uyarınca, bu suçtan dolayı başlatılan soruşturmada Cumhuriyet savcısı kamu davasının açılmasının ertelenmesi kararı verir ve şüpheliyi denetimli serbestlik tedbirine tabi tutar.",
    "options": [
      {"id": "a", "text": "Doğrudan kamu davası açılır"},
      {"id": "b", "text": "Kovuşturmaya yer olmadığı kararı verilir"},
      {"id": "c", "text": "Kamu davasının açılmasının ertelenmesi kararı verilir"},
      {"id": "d", "text": "Hükmün açıklanmasının geri bırakılması kararı verilir"},
      {"id": "e", "text": "Derhal tutuklama kararı istenir"}
    ]
  },
  {
    "id": "narkotik-008",
    "order": 8,
    "topic": "TCK 191 - Denetimli Serbestlik Süresi",
    "difficulty": "Orta",
    "text": "Kamu davasının açılmasının ertelenmesi kararı verilen şüpheli hakkında uygulanacak denetimli serbestlik süresi ne kadardır?",
    "correctOptionId": "c",
    "explanation": "TCK Madde 191/3'e göre erteleme süresi zarfında şüpheli hakkında asgari bir yıl süreyle denetimli serbestlik tedbiri uygulanır.",
    "options": [
      {"id": "a", "text": "Altı ay"},
      {"id": "b", "text": "Dokuz ay"},
      {"id": "c", "text": "Bir yıl"},
      {"id": "d", "text": "İki yıl"},
      {"id": "e", "text": "Beş yıl"}
    ]
  },
  {
    "id": "narkotik-009",
    "order": 9,
    "topic": "TCK 191 - Yükümlülüklerin İhlali",
    "difficulty": "Orta",
    "text": "Denetimli serbestlik tedbiri uygulanan kişinin kendisine yüklenen yükümlülüklere veya uygulanan tedavinin gereklerine uygun davranmamakta ısrar etmesi durumunda aşağıdakilerden hangisi gerçekleşir?",
    "correctOptionId": "d",
    "explanation": "TCK Madde 191/4-a uyarınca şüpheli erteleme süresi zarfında yükümlülüklere uymazsa kamu davası açılır.",
    "options": [
      {"id": "a", "text": "Denetimli serbestlik süresi uzatılır"},
      {"id": "b", "text": "Sadece para cezası uygulanır"},
      {"id": "c", "text": "Tedavi süresi yeniden başlatılır"},
      {"id": "d", "text": "Kamu davası açılır"},
      {"id": "e", "text": "Hüküm özlü kabul edilir"}
    ]
  },
  {
    "id": "narkotik-010",
    "order": 10,
    "topic": "TCK 191 - Erteleme Süresi",
    "difficulty": "Kolay",
    "text": "TCK Madde 191'e göre kamu davasının açılmasının ertelenmesi süresi kaç yıldır?",
    "correctOptionId": "e",
    "explanation": "TCK Madde 191/2'ye göre Cumhuriyet savcısı şüpheli hakkında beş yıl süreyle kamu davasının açılmasının ertelenmesine karar verir.",
    "options": [
      {"id": "a", "text": "Bir yıl"},
      {"id": "b", "text": "İki yıl"},
      {"id": "c", "text": "Üç yıl"},
      {"id": "d", "text": "Dört yıl"},
      {"id": "e", "text": "Beş yıl"}
    ]
  },
  {
    "id": "narkotik-011",
    "order": 11,
    "topic": "Narkotik Maddelerin Özellikleri",
    "difficulty": "Kolay",
    "text": "Bitkinin tepe yaprakları, reçinesi veya goncalarının kurutularak elde edildiği, ülkemizde genellikle 'sigara' şeklinde sarılarak tüketilen, uyuşturucu etkiye sahip doğal uyuşturucu madde aşağıdakilerden hangisidir?",
    "correctOptionId": "a",
    "explanation": "Esrar (Kenevir otu), Hint keneviri bitkisinden elde edilen ve yaygın olarak sigara formunda tüketilen doğal bir uyuşturucu maddedir.",
    "options": [
      {"id": "a", "text": "Esrar"},
      {"id": "b", "text": "Eroin"},
      {"id": "c", "text": "Kokain"},
      {"id": "d", "text": "Metamfetamin"},
      {"id": "e", "text": "Sentetik Kannabinoid"}
    ]
  },
  {
    "id": "narkotik-012",
    "order": 12,
    "topic": "Narkotik Maddelerin Özellikleri",
    "difficulty": "Orta",
    "text": "Morfinin kimyasal işlemlerden geçirilmesiyle elde edilen, genellikle kirli beyaz, kahverengi renkte olan, ani tolerans ve çok güçlü fizyolojik bağımlılık yapan yarı sentetik uyuşturucu madde hangisidir?",
    "correctOptionId": "b",
    "explanation": "Eroin, haşhaş kozasından elde edilen afyonun işlenmesiyle elde edilen morfinden sentezlenen güçlü bağımlılık yapıcı bir yarı sentetik uyuşturucudur.",
    "options": [
      {"id": "a", "text": "Esrar"},
      {"id": "b", "text": "Eroin"},
      {"id": "c", "text": "Ecstasy"},
      {"id": "d", "text": "Metamfetamin"},
      {"id": "e", "text": "Kokain"}
    ]
  },
  {
    "id": "narkotik-013",
    "order": 13,
    "topic": "Narkotik Maddelerin Özellikleri",
    "difficulty": "Orta",
    "text": "Güney Amerika'da yetişen koka ağacının yapraklarından kimyasal yöntemlerle elde edilen, merkezi sinir sistemini güçlü şekilde uyaran, toz halinde burna çekilerek tüketilen uyuşturucu hangisidir?",
    "correctOptionId": "c",
    "explanation": "Kokain, koka bitkisinden elde edilen, merkezi sinir sistemini aşırı uyaran (stimülan) özellikli bir doğal alkaloiddir.",
    "options": [
      {"id": "a", "text": "Metamfetamin"},
      {"id": "b", "text": "Eroin"},
      {"id": "c", "text": "Kokain"},
      {"id": "d", "text": "Captagon"},
      {"id": "e", "text": "Afyon"}
    ]
  },
  {
    "id": "narkotik-014",
    "order": 14,
    "topic": "Narkotik Maddelerin Özellikleri",
    "difficulty": "Zor",
    "text": "Halk arasında 'kristal', 'buz', 'ateş' gibi isimlerle anılan, sentetik yollarla üretilen, merkezi sinir sistemini etkileyerek diş çürümelerine (meth mouth), aşırı kilo kaybına ve şiddetli paranoyaya neden olan uyarıcı uyuşturucu madde hangisidir?",
    "correctOptionId": "d",
    "explanation": "Metamfetamin (Meth), laboratuvar ortamında üretilen son derece güçlü bir uyarıcı (stimülan) maddedir ve halk arasında buz, kristal gibi isimlerle bilinir.",
    "options": [
      {"id": "a", "text": "Bonzai"},
      {"id": "b", "text": "Esrar"},
      {"id": "c", "text": "Ecstasy"},
      {"id": "d", "text": "Metamfetamin"},
      {"id": "e", "text": "Kokain"}
    ]
  },
  {
    "id": "narkotik-015",
    "order": 15,
    "topic": "Narkotik Maddelerin Özellikleri",
    "difficulty": "Orta",
    "text": "Doğal görünümlü bitki yapraklarına kimyasal maddelerin emdirilmesiyle elde edilen, halk arasında 'Bonzai' veya 'Jamaika' adıyla bilinen ve ani ölümlere (kalp krizi) sebep olma riski çok yüksek olan uyuşturucu türü nedir?",
    "correctOptionId": "a",
    "explanation": "Sentetik kannabinoidler (Bonzai, Jamaika vs.), laboratuvar ortamında üretilen kimyasalların kuru bitki yapraklarına püskürtülmesiyle elde edilen ve ölümcül etkileri olan sentetik maddelerdir.",
    "options": [
      {"id": "a", "text": "Sentetik Kannabinoidler"},
      {"id": "b", "text": "Yarı Sentetik Opiyatlar"},
      {"id": "c", "text": "Kokain"},
      {"id": "d", "text": "Metamfetamin"},
      {"id": "e", "text": "Eroin"}
    ]
  }
]

def clean_iletişim_questions(questions):
    for q in questions:
        # Replace occurrences of 'Sunudaki tanıma göre ', 'sunuya göre ', etc.
        q['text'] = re.sub(r'^[Ss]unudaki tanıma göre\s*,?\s*', '', q.get('text', ''))
        q['text'] = re.sub(r'^[Ss]unuya göre\s*,?\s*', '', q.get('text', ''))
        q['text'] = re.sub(r'\s*[Ss]unuda\s+', ' ', q.get('text', ''))
        q['text'] = re.sub(r'\s*[Ss]unuya göre\s*', ' ', q.get('text', ''))
        
        # Capitalize the first letter if it was lowercased by the replacement
        if len(q['text']) > 0:
            q['text'] = q['text'][0].upper() + q['text'][1:]

        # Clean explanations
        if 'explanation' in q:
            q['explanation'] = re.sub(r'[Ss]unudaki\s+', '', q['explanation'])
            q['explanation'] = re.sub(r'[Ss]unuya\s+', '', q['explanation'])
            q['explanation'] = re.sub(r'[Ss]unuda\s+', '', q['explanation'])
            
            if len(q['explanation']) > 0:
                q['explanation'] = q['explanation'][0].upper() + q['explanation'][1:]
                
        # Clean options
        if 'options' in q:
            for opt in q['options']:
                opt['text'] = re.sub(r'[Ss]unudaki\s+', '', opt.get('text', ''))
                opt['text'] = re.sub(r'[Ss]unuya\s+', '', opt.get('text', ''))
                if len(opt['text']) > 0:
                    opt['text'] = opt['text'][0].upper() + opt['text'][1:]

with open('data/firestore-seed.json', 'r') as f:
    data = json.load(f)

for session in data.get('sessions', []):
    for course in session.get('courses', []):
        if course.get('id') == 'narkotik-maddeler':
            course['questions'] = new_questions
        elif course.get('id') == 'iletişim':
            clean_iletişim_questions(course.get('questions', []))

if 'metadata' not in data:
    data['metadata'] = {}
data['metadata']['questionBankVersion'] = 'v5'

with open('data/firestore-seed.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
