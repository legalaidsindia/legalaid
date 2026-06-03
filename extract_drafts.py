import os
import re
import json
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

print("==================================================")
print("     Master Legal Drafts Catalog Compiler v3.1    ")
print("==================================================")

SOURCE_DIR = r"E:\Users\SM\Downloads\Legal Drafts (e)\Legal Drafts LawLevelUP"
TARGET_INDEX = os.path.join("js", "drafts_index.json")
TARGET_WIZARD_TEMPLATES = os.path.join("js", "document_templates.json")
TEMPLATES_OUT_DIR = "templates"

os.makedirs(TEMPLATES_OUT_DIR, exist_ok=True)

# Precompile regexes to avoid string slicing and speed up parser dramatically
WORD_RE = re.compile(r'([a-zA-Z]+)(-?\d*)')
HEX_RE = re.compile(r'[0-9a-fA-F]{2}')

def make_safe_filename(name):
    name_no_ext = os.path.splitext(name)[0]
    safe = re.sub(r'[^a-zA-Z0-9\s\-\_]', '', name_no_ext)
    safe = re.sub(r'\s+', '_', safe.strip())
    return safe[:100]

def clean_rtf_file(file_path):
    try:
        with open(file_path, "r", encoding="latin-1", errors="ignore") as f:
            rtf_content = f.read()
            
        stack = [False]
        ignored_control_words = {
            'fonttbl', 'colortbl', 'stylesheet', 'info', 'themedata',
            'datastore', 'xmlnstbl', 'latentstyles', 'rsidtbl', 'generator',
            'header', 'footer', 'listtable', 'listoverridetable'
        }
        
        text = []
        i = 0
        n = len(rtf_content)
        
        while i < n:
            c = rtf_content[i]
            
            if c == '{':
                stack.append(stack[-1])
                i += 1
            elif c == '}':
                if len(stack) > 1:
                    stack.pop()
                i += 1
            elif c == '\\':
                i += 1
                if i >= n:
                    break
                
                next_c = rtf_content[i]
                if next_c in '{}\\':
                    if not stack[-1]:
                        text.append(next_c)
                    i += 1
                elif next_c == "'":
                    # Use HEX_RE.match with pos to avoid slicing
                    hex_match = HEX_RE.match(rtf_content, pos=i+1)
                    if hex_match:
                        try:
                            byte_val = int(hex_match.group(0), 16)
                            char_val = chr(byte_val)
                            if not stack[-1] and byte_val >= 32:
                                text.append(char_val)
                        except ValueError:
                            pass
                        i += 3
                    else:
                        i += 1
                elif next_c == '~':
                    if not stack[-1]:
                        text.append(' ')
                    i += 1
                elif next_c == '_':
                    i += 1
                elif next_c == '*':
                    stack[-1] = True
                    i += 1
                else:
                    # Use WORD_RE.match with pos to avoid slicing
                    word_match = WORD_RE.match(rtf_content, pos=i)
                    if word_match:
                        word = word_match.group(1)
                        i += len(word_match.group(0))
                        
                        if i < n and rtf_content[i] == ' ':
                            i += 1
                        
                        if word == 'par' or word == 'line':
                            if not stack[-1]:
                                text.append('\n')
                        elif word == 'tab':
                            if not stack[-1]:
                                text.append('\t')
                        elif word in ignored_control_words:
                            stack[-1] = True
                    else:
                        i += 1
            else:
                if not stack[-1]:
                    text.append(c)
                i += 1
                
        raw_text = "".join(text)
        
        raw_text = raw_text.replace('\x91', '‘').replace('\x92', '’').replace('\x93', '“').replace('\x94', '”').replace('\x95', '•').replace('\x96', '–').replace('\x97', '—')
        
        lines = []
        for line in raw_text.split('\n'):
            line = re.sub(r'[ \t]+', ' ', line).strip()
            if line:
                lines.append(line)
                
        return '\n'.join(lines)
    except Exception as e:
        print(f"[ERROR] Could not parse RTF file {file_path}: {e}")
        return ""

index_data = {
    "categories": {}
}

total_compiled = 0

subdirs = [d for d in os.listdir(SOURCE_DIR) if os.path.isdir(os.path.join(SOURCE_DIR, d))]
print(f"[INFO] Scanning {len(subdirs)} subfolders inside the templates root...")

for cat in sorted(subdirs):
    cat_path = os.path.join(SOURCE_DIR, cat)
    rtf_files = [f for f in os.listdir(cat_path) if f.lower().endswith('.rtf')]
    
    if not rtf_files:
        continue
        
    print(f"[INFO] Processing category '{cat}': found {len(rtf_files)} templates...")
    index_data["categories"][cat] = []
    
    cat_out_dir = os.path.join(TEMPLATES_OUT_DIR, cat)
    os.makedirs(cat_out_dir, exist_ok=True)
    
    for filename in rtf_files:
        full_path = os.path.join(cat_path, filename)
        cleaned_text = clean_rtf_file(full_path)
        
        if not cleaned_text.strip():
            continue
            
        safe_fn = make_safe_filename(filename) + ".txt"
        out_filepath = os.path.join(cat_out_dir, safe_fn)
        
        with open(out_filepath, "w", encoding="utf-8") as out_f:
            out_f.write(cleaned_text)
            
        relative_path = f"templates/{cat}/{safe_fn}"
        
        display_name = os.path.splitext(filename)[0]
        display_name = re.sub(r'^[\s\,]+', '', display_name).strip()
        display_name = re.sub(r'\s+', ' ', display_name)
        
        index_data["categories"][cat].append({
            "name": display_name,
            "path": relative_path
        })
        
        total_compiled += 1

os.makedirs(os.path.dirname(TARGET_INDEX), exist_ok=True)
with open(TARGET_INDEX, "w", encoding="utf-8") as f:
    json.dump(index_data, f, indent=2, ensure_ascii=False)

wizard_mappings = {
    "rental": os.path.join(SOURCE_DIR, "Agreement", "Agreement of Tenancy.rtf"),
    "employment": os.path.join(SOURCE_DIR, "Agreement", "APPOINTMENT LETTER OF A PROBATIONER.rtf"),
    "eviction": os.path.join(SOURCE_DIR, "Notice", "NOTICE BY LANDLORD TO TENANT FOR DEMAND OF POSSESSION OF HOUSE AFTER EXPIRY OF LEASE PERIOD.rtf"),
    "demand": os.path.join(SOURCE_DIR, "Notice", "Notice for Business Outstanding.rtf"),
    "sec138": os.path.join(SOURCE_DIR, "Notice", "NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT FOR DISHONOUR OF CHEQUE.rtf"),
    "criminal_complaint": os.path.join(SOURCE_DIR, "Criminal Pleading", "CRIMINAL COMPLAINT.rtf")
}

fallbacks = {
    "rental": ("Rent", "LEASES"),
    "employment": ("Appointment", "APPOINTMENT"),
    "eviction": ("Notice", "NOTICE_BY_LANDLORD_TO_TENANT"),
    "demand": ("Notice", "DEBT"),
    "sec138": ("Notice", "138"),
    "criminal_complaint": ("Criminal Pleading", "COMPLAINT")
}

wizard_templates_data = {}

print("\n[INFO] Compiling wizard-specific templates for document-generator tabs...")
for key, filepath in wizard_mappings.items():
    actual_path = filepath
    
    if not os.path.exists(actual_path):
        folder_sub, keyword = fallbacks[key]
        search_folder = os.path.join(SOURCE_DIR, folder_sub)
        if os.path.exists(search_folder):
            for f in os.listdir(search_folder):
                if keyword.lower() in f.lower() and f.lower().endswith(".rtf"):
                    actual_path = os.path.join(search_folder, f)
                    break
                    
    if os.path.exists(actual_path):
        print(f"  Mapping wizard key '{key}' to: {os.path.relpath(actual_path, SOURCE_DIR)}")
        cleaned_text = clean_rtf_file(actual_path)
        
        category = "contracts" if key in ["rental", "employment"] else "notices" if key in ["eviction", "demand", "sec138"] else "fir"
        title = "Agreement of Tenancy" if key == "rental" else "Probationer Appointment" if key == "employment" else "Eviction Notice" if key == "eviction" else "Demand Notice" if key == "demand" else "Section 138 Notice" if key == "sec138" else "Criminal Complaint"
        fields = ["party1", "party2"] if category == "contracts" else ["sender", "details"]
        
        wizard_templates_data[key] = {
            "key": key,
            "category": category,
            "title": title,
            "fields": fields,
            "template_text": cleaned_text
        }
    else:
        print(f"  [WARNING] Could not locate RTF template for key '{key}'")
        wizard_templates_data[key] = {
            "key": key,
            "category": "contracts" if key in ["rental", "employment"] else "notices",
            "title": key.title(),
            "fields": ["party1", "party2"],
            "template_text": f"Placeholder template for {key}. Please place the appropriate RTF template in the drafts folder."
        }

with open(TARGET_WIZARD_TEMPLATES, "w", encoding="utf-8") as f:
    json.dump(wizard_templates_data, f, indent=2, ensure_ascii=False)

print(f"\n[SUCCESS] Compilation complete!")
print(f"[SUCCESS] Total compiled templates: {total_compiled}")
print(f"[SUCCESS] Index file written to: {os.path.abspath(TARGET_INDEX)}")
print(f"[SUCCESS] Wizard templates written to: {os.path.abspath(TARGET_WIZARD_TEMPLATES)}")
print(f"[SUCCESS] Cleaned individual text templates saved to: {os.path.abspath(TEMPLATES_OUT_DIR)}")
print("==================================================")
