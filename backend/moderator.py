# Description: This script is used to moderate a transcript for harmful content and misinformation.
# works properly


from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import time
from datetime import datetime
import concurrent.futures
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load environment variables
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class TranscriptModerator:
    def __init__(self, chunk_size=600, overlap=100):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.overlap,
            length_function=len
        )

    def moderate_transcript(self, transcript, threshold=0.8, check_misinformation=True, max_workers=8):
        chunks = self.text_splitter.split_text(transcript)
        problematic_sections = []
        misinformation_sections = []

        print(f"Processing {len(chunks)} chunks...")

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_chunk = {
                executor.submit(self._safe_process_chunk, chunk, i, threshold, check_misinformation): i 
                for i, chunk in enumerate(chunks)
            }

            for future in concurrent.futures.as_completed(future_to_chunk):
                chunk_idx = future_to_chunk[future]
                try:
                    harm_result, misinfo_result = future.result()
                    if harm_result:
                        problematic_sections.append(harm_result)
                    if misinfo_result:
                        misinformation_sections.append(misinfo_result)
                    print(f"✓ Completed chunk {chunk_idx+1}/{len(chunks)}")
                except Exception as e:
                    print(f"× Error processing chunk {chunk_idx+1}: {str(e)}")

        return problematic_sections, misinformation_sections

    def _safe_process_chunk(self, chunk, chunk_index, threshold, check_misinformation):
        retries = 5
        backoff_factor = 2
        for attempt in range(retries):
            try:
                return self._process_chunk(chunk, chunk_index, threshold, check_misinformation)
            except Exception as e:
                if "rate limit" in str(e).lower():
                    wait_time = backoff_factor ** attempt
                    print(f"Rate limit hit! Retrying chunk {chunk_index} in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    print(f"Error in _safe_process_chunk for chunk {chunk_index}: {str(e)}")
                    break
        return None, None

    def _process_chunk(self, chunk, chunk_index, threshold, check_misinformation):
        harmful_result = None
        misinformation_result = None

        try:
            response = client.moderations.create(
                model="omni-moderation-latest",
                input=chunk
            )

            if response.results[0].flagged:
                flagged_lines = self._check_flagged_lines_in_chunk(chunk, threshold)
                if flagged_lines:
                    harmful_result = {
                        "chunk_index": chunk_index,
                        "flagged_lines": flagged_lines
                    }

            if check_misinformation:
                misinformation_result = self._check_misinformation_in_chunk_batch(chunk, chunk_index)

        except Exception as e:
            print(f"Error in _process_chunk for chunk {chunk_index}: {str(e)}")

        return harmful_result, misinformation_result

    def _check_flagged_lines_in_chunk(self, chunk, threshold):
        flagged_lines = []
        lines = chunk.split("\n")

        for idx, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            try:
                response = client.moderations.create(
                    model="omni-moderation-latest",
                    input=line
                )

                if response.results[0].flagged:
                    categories = vars(response.results[0].categories)
                    scores = vars(response.results[0].category_scores)

                    flagged_categories = {
                        cat: {"score": scores[cat], "text": line}
                        for cat, is_flagged in categories.items()
                        if is_flagged and scores[cat] >= threshold
                    }

                    if flagged_categories:
                        flagged_lines.append({
                            "line_number": idx + 1,
                            "text": line,
                            "flagged_categories": flagged_categories
                        })
            except Exception as e:
                print(f"Error processing line {idx}: {str(e)}")

        return flagged_lines

    def _check_misinformation_in_chunk_batch(self, chunk, chunk_index):
        chunk_text = chunk.strip()
        if not chunk_text:
            return None

        misinformation_result = self._analyze_text_for_misinformation(chunk_text)
        if misinformation_result["is_misinformation"]:
            return {
                "chunk_index": chunk_index,
                "text": chunk_text,
                "misinformation_details": misinformation_result
            }

        return None

    def _analyze_text_for_misinformation(self, text):
        retries = 5
        backoff_factor = 2

        for attempt in range(retries):
            try:
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "Analyze the text for misinformation. Return only definite misinformation with high confidence."},
                        {"role": "user", "content": f"Text:\n\n{text}\n\nReturn JSON: is_misinformation (boolean), confidence (0-1), explanation, correction."}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                    max_tokens=300
                )

                return json.loads(response.choices[0].message.content)

            except Exception as e:
                if "rate limit" in str(e).lower():
                    wait_time = backoff_factor ** attempt
                    print(f"Rate limit hit! Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    print(f"Error analyzing misinformation: {str(e)}")
                    return {"is_misinformation": False, "confidence": 0, "explanation": f"Error: {str(e)}"}

        return {"is_misinformation": False, "confidence": 0, "explanation": "Failed after retries"}

    def generate_moderation_report(self, transcript, output_filename="moderation_report.json", max_workers=5):
        problematic_sections, misinformation_sections = self.moderate_transcript(
            transcript, max_workers=max_workers
        )

        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "problematic_sections": problematic_sections,
            "misinformation_sections": misinformation_sections
        }

        with open(output_filename, "w") as f:
            json.dump(report, f, indent=4)

        print(f"Moderation report saved to {output_filename}")
        return report

# Example usage
if __name__ == "__main__":
    transcript_file = "podcast_transcript.txt"

    try:
        with open(transcript_file, 'r') as f:
            transcript = f.read()

        moderator = TranscriptModerator()
        report = moderator.generate_moderation_report(
            transcript, 
            "moderation_report.json", 
            max_workers=5
        )

        print("\nFull report saved to moderation_report.json")

    except FileNotFoundError:
        print(f"Transcript file '{transcript_file}' not found.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
