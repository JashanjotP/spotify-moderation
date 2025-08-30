# 🎧 Audio Moderation Pipeline

A production-ready pipeline for **moderating spoken audio content** such as podcasts, interviews, or songs.  
The system automatically transcribes audio files, runs them through OpenAI’s **omni-moderation** model, and generates a structured moderation report in both **JSON** and **Markdown** formats.

---

## ✨ Features

- 🎙 **Audio Transcription** – Converts `.mp3`, `.wav`, `.m4a` files into clean text using [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text).  
- 🧩 **Chunked Analysis** – Splits transcripts into manageable chunks for accurate moderation.  
- 🔍 **AI-Powered Moderation** – Uses [OpenAI’s omni-moderation-latest model](https://platform.openai.com/docs/guides/moderation) to evaluate risks across categories (hate, self-harm, sexual/minors, etc.).  
- 📊 **Report Generation** – Produces:
  - `moderation_report.json` → machine-readable structured results
  - `moderation_report.md` → human-friendly Markdown summary  
- ⏱ **Timestamps** – Approximate segment timings (can be upgraded with timestamped ASR).  
- 🛡 **Policy-Driven** – Configurable thresholds per category to match compliance requirements.  

---

## 📂 Project Structure

.
├── app.py # Main script to run the pipeline
├── requirements.txt # Python dependencies
├── moderation_report.json # Example structured moderation report
├── moderation_report.md # Example Markdown report
└── README.md # Project documentation


---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/audio-moderation-pipeline.git
cd audio-moderation-pipeline

2. Install Dependencies
pip install -r requirements.txt

3. Set Your API Key

Export your OpenAI API key:

export OPENAI_API_KEY="your_api_key_here"


(Windows PowerShell)

$env:OPENAI_API_KEY="your_api_key_here"

4. Run the Pipeline
python app.py /path/to/audio.mp3


Optionally include an estimated duration in seconds:

python app.py /path/to/podcast.wav 3600

📑 Output

After running, you’ll get:

moderation_report.json

{
  "audio_meta": { "filename": "podcast.mp3", "duration_s": 3600, "language": "en" },
  "summary": { "overall_risk": "medium", "top_categories": ["hate/threatening", "self-harm"] },
  "categories": { "...": "..." },
  "chunk_results": [ ... ]
}
```
