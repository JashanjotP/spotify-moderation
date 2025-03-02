from openai import OpenAI
from dotenv import load_dotenv
import os
import json
from datetime import datetime

# Load environment variables
load_dotenv()
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

class TranscriptModerator:
    def __init__(self, chunk_size=1000, overlap=100):
        """
        Initialize the transcript moderator.
        
        Args:
            chunk_size: Maximum size of text chunks to send to the moderation API
            overlap: Number of characters to overlap between chunks to avoid missing context
        """
        self.chunk_size = chunk_size
        self.overlap = overlap
        
    def _chunk_transcript(self, transcript):
        """Split transcript into overlapping chunks."""
        chunks = []
        chunk_indexes = []
        
        for i in range(0, len(transcript), self.chunk_size - self.overlap):
            chunk = transcript[i:i + self.chunk_size]
            if chunk:  # Ensure chunk is not empty
                chunks.append(chunk)
                chunk_indexes.append((i, i + len(chunk)))
                
        return chunks, chunk_indexes
    
    def moderate_transcript(self, transcript, threshold=0.8):
        """
        Moderate the entire transcript by analyzing it in chunks.
        
        Args:
            transcript: The full transcript text
            threshold: Score threshold above which content is flagged
            
        Returns:
            List of problematic sections with details
        """
        chunks, chunk_indexes = self._chunk_transcript(transcript)
        problematic_sections = []
        
        print(f"Processing {len(chunks)} chunks...")
        
        for i, (chunk, (start_idx, end_idx)) in enumerate(zip(chunks, chunk_indexes)):
            print(f"Processing chunk {i+1}/{len(chunks)}")
            
            try:
                response = client.moderations.create(
                    model="omni-moderation-latest",
                    input=chunk
                )
                
                # Check if content was flagged
                if response.results[0].flagged:
                    # Get categories and scores
                    categories = vars(response.results[0].categories)
                    scores = vars(response.results[0].category_scores)
                    
                    # Find which categories were flagged with high scores
                    flagged_categories = {
                        cat: {
                            "score": scores[cat],
                            "text": chunk
                        }
                        for cat, is_flagged in categories.items()
                        if is_flagged and scores[cat] >= threshold
                    }
                    
                    if flagged_categories:
                        # Add to problematic sections
                        problematic_sections.append({
                            "chunk_index": i,
                            "start_position": start_idx,
                            "end_position": end_idx,
                            "text": chunk,
                            "flagged_categories": flagged_categories
                        })
            
            except Exception as e:
                print(f"Error processing chunk {i}: {str(e)}")
        
        return problematic_sections

    def generate_moderation_report(self, transcript, output_file=None):
        """
        Generate a full moderation report for the transcript.
        
        Args:
            transcript: The full transcript text
            output_file: Optional file path to save the report
            
        Returns:
            Moderation report as a dictionary
        """
        problematic_sections = self.moderate_transcript(transcript)
        
        # Create report
        report = {
            "timestamp": datetime.now().isoformat(),
            "transcript_length": len(transcript),
            "flagged_sections_count": len(problematic_sections),
            "flagged_sections": problematic_sections
        }
        
        # Save report if output file specified
        if output_file:
            with open(output_file, 'w') as f:
                json.dump(report, f, indent=2)
                
        return report
    
    def display_problematic_content(self, report, context_window=50):
        """
        Display problematic content from the report with surrounding context.
        
        Args:
            report: Moderation report
            context_window: Number of characters to show before and after flagged content
        """
        if report["flagged_sections_count"] == 0:
            print("No problematic content detected.")
            return
            
        print(f"\n===== MODERATION REPORT: {report['flagged_sections_count']} problematic sections found =====\n")
        
        for i, section in enumerate(report["flagged_sections"]):
            print(f"\n--- Problematic Section #{i+1} ---")
            print(f"Position: Characters {section['start_position']} to {section['end_position']}")
            
            # Print categories with scores
            print("Flagged categories:")
            for cat, details in section["flagged_categories"].items():
                print(f"  - {cat}: {details['score']:.4f}")
            
            # Get the problematic text with context
            full_transcript = report.get("full_transcript", "")
            if full_transcript:
                start = max(0, section['start_position'] - context_window)
                end = min(len(full_transcript), section['end_position'] + context_window)
                
                context_before = full_transcript[start:section['start_position']]
                flagged_text = full_transcript[section['start_position']:section['end_position']]
                context_after = full_transcript[section['end_position']:end]
                
                print("\nContent with context:")
                print(f"...{context_before}[[[{flagged_text}]]]{context_after}...")
            else:
                # If full transcript isn't in the report, use the section text
                print("\nFlagged content:")
                print(section['text'])
            
            print("-" * 50)

# Example usage
if __name__ == "__main__":
    # Load a transcript from file
    transcript_file = "podcast_transcript.txt"
    
    try:
        with open(transcript_file, 'r') as f:
            transcript = f.read()
            
        # Create moderator and analyze transcript
        moderator = TranscriptModerator()
        report = moderator.generate_moderation_report(transcript, "moderation_report.json")
        
        # Add full transcript to report for context display
        report["full_transcript"] = transcript
        
        # Display problematic content
        moderator.display_problematic_content(report)
        
        print(f"\nFull report saved to moderation_report.json")
        
    except FileNotFoundError:
        print(f"Transcript file '{transcript_file}' not found.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")