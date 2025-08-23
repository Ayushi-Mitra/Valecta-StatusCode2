import pandas as pd
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import fitz  # PyMuPDF
import docx
import requests
import os
from pathlib import Path

# --- 1. Load Dataset ---
path = Path(__file__).parent /"Resume.csv"
df = pd.read_csv(path)
df = df.dropna().reset_index(drop=True)
resume_texts = df["Resume_str"]

def clean_text(text):
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z]", " ", text)
    text = text.lower()
    return text

df["Cleaned"] = resume_texts.apply(clean_text)
vectorizer = TfidfVectorizer(stop_words="english")
X = vectorizer.fit_transform(df["Cleaned"])

# --- 2. Extract Text from Resume ---
def extract_text_from_pdf_pymupdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"PyMuPDF PDF Text extraction error: {e}")
        return ""

def extract_text_from_docx(docx_path):
    doc = docx.Document(docx_path)
    return " ".join([para.text for para in doc.paragraphs])

def extract_resume_text(file_path):
    if file_path.lower().endswith(".pdf"):
        return extract_text_from_pdf_pymupdf(file_path)
    elif file_path.lower().endswith(".docx"):
        return extract_text_from_docx(file_path)
    else:
        raise ValueError("Unsupported file format. Only PDF and DOCX supported.")

# --- 3. Extract URLs from Resume ---
def extract_urls(text):
    url_pattern = r'https?://[^\s,]+'
    return re.findall(url_pattern, text)

# --- 4. Plagiarism Check (Resume) ---
def check_similarity(uploaded_resume_text, threshold=0.75, source="resume"):
    cleaned_resume = clean_text(uploaded_resume_text)
    vec = vectorizer.transform([cleaned_resume])
    similarity_scores = cosine_similarity(vec, X)[0]
    max_score = similarity_scores.max()
    most_similar_index = similarity_scores.argmax()
    category = df.iloc[most_similar_index]["Category"]
    if source == "resume":
        if max_score >= threshold:
            return f"❌ Resume Plagiarism Detected! Similarity: {max_score:.2f} | Closest Category: {category}"
        else:
            return f"✅ Resume is Unique! (Max Similarity: {max_score:.2f})"
    elif source == "certificate":
        # Only verification, no similarity score
        return f"✅ Certificate Verified!"

# --- 5. Fetch Certificate Content from URLs ---
def fetch_certificate_text(url):
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 404:
            print(f"Certificate URL '{url}' returned 404: Not a valid certificate.")
            return None  # Indicate invalid certificate
        resp.raise_for_status()
        text = re.sub(r'<[^>]+>', '', resp.text)
        return text[:1000]
    except Exception as e:
        print(f"Error fetching certificate URL '{url}': {e}")
        return ""

# --- 6. Main Logic ---
def plagiarism_checker(resume_file_path):
    if not os.path.exists(resume_file_path):
        return None, []
    resume_text = extract_resume_text(resume_file_path)
    cert_urls = extract_urls(resume_text)
    # Resume plagiarism check
    try:
        result = check_similarity(resume_text, source="resume")
        if result.startswith("❌ Resume Plagiarism Detected"):
            resume_bool = True
        elif result.startswith("✅ Resume is Unique"):
            resume_bool = False
        else:
            resume_bool = None
    except Exception:
        resume_bool = None

    cert_results = []
    for url in cert_urls:
        cert_text = fetch_certificate_text(url)
        if cert_text is None:
            cert_results.append(False)
            continue
        if not cert_text.strip():
            cert_results.append(None)
            continue
        cert_result = check_similarity(cert_text, source="certificate")
        if cert_result.startswith("✅ Certificate Verified"):
            cert_results.append(True)
        else:
            cert_results.append(None)
    # Final decision logic
    if resume_bool in [True, None]:
        return False
    if any(c in [False, None] for c in cert_results):
        return False
    return True
