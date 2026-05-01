import json
import re

def parse_questions():
    with open('data/raw-olay-yeri.txt', 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by numbers followed by dot
    # Example: "1. Fransız Kriminal Uzman..."
    
    pattern = re.compile(
        r'(?P<num>\d+)\.\s+(?P<text>.*?)\s+'
        r'A\)\s+(?P<a>.*?)\s+'
        r'B\)\s+(?P<b>.*?)\s+'
        r'C\)\s+(?P<c>.*?)\s+'
        r'D\)\s+(?P<d>.*?)\s+'
        r'E\)\s+(?P<e>.*?)\s+'
        r'Cevap:\s*(?P<ans>[A-E])(?:\s*\((?P<exp>.*?)\))?',
        re.DOTALL
    )

    questions = []
    idx = 1
    for match in pattern.finditer(content):
        q = match.groupdict()
        
        opt_a = q['a'].strip()
        opt_b = q['b'].strip()
        opt_c = q['c'].strip()
        opt_d = q['d'].strip()
        opt_e = q['e'].strip()
        
        ans_id = q['ans'].strip().lower()
        exp = q['exp'].strip() if q['exp'] else ""
        
        q_obj = {
            "id": f"olayyeri-{idx:03d}",
            "order": idx,
            "topic": "Olay Yeri İnceleme",
            "difficulty": "Orta",
            "text": q['text'].strip(),
            "correctOptionId": ans_id,
            "explanation": exp,
            "options": [
                {"id": "a", "text": opt_a},
                {"id": "b", "text": opt_b},
                {"id": "c", "text": opt_c},
                {"id": "d", "text": opt_d},
                {"id": "e", "text": opt_e}
            ]
        }
        questions.append(q_obj)
        idx += 1
        
    return questions

def main():
    questions = parse_questions()
    print(f"Parsed {len(questions)} questions")
    
    with open('data/firestore-seed.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for session in data.get('sessions', []):
        for course in session.get('courses', []):
            if course.get('id') == 'olay-yeri-inceleme-ilk-ekip':
                course['questions'] = questions
                # Do we update expected question count to 60? The user said "olay yeri 11 soru çıkacakmış"
                # so expectedQuestionCount remains 11, but the question bank gets 60 questions.
                print(f"Added to {course['id']}")
                break
                
    if 'metadata' not in data:
        data['metadata'] = {}
    data['metadata']['questionBankVersion'] = 'v6'
    
    with open('data/firestore-seed.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
