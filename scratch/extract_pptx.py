import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def extract_text_from_pptx(path):
    if not os.path.exists(path):
        return ""
    
    texts = []
    try:
        with zipfile.ZipFile(path, 'r') as zip_ref:
            # Slides are usually in ppt/slides/slideN.xml
            # We should find all of them and sort them
            slide_files = [f for f in zip_ref.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
            slide_files.sort(key=lambda x: int(''.join(filter(str.isdigit, x))))
            
            for slide_file in slide_files:
                xml_content = zip_ref.read(slide_file)
                tree = ET.fromstring(xml_content)
                # Find all text nodes (a:t)
                # PPTX uses namespaces
                namespace = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
                for t in tree.findall('.//a:t', namespace):
                    if t.text:
                        texts.append(t.text)
                texts.append("\n--- Slide End ---\n")
    except Exception as e:
        return f"Error: {str(e)}"
    
    return "\n".join(texts)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 extract_pptx.py <path>")
    else:
        print(extract_text_from_pptx(sys.argv[1]))
