import os
import argparse
import speech_recognition as sr
from pydub import AudioSegment
from tqdm import tqdm
import concurrent.futures
import tempfile

def convert_audio_to_wav(input_file, output_file):
    """Convert various audio formats to WAV for speech recognition."""
    audio = AudioSegment.from_file(input_file)
    audio.export(output_file, format="wav")
    return output_file

def transcribe_chunk(chunk_data, chunk_index):
    """
    Transcribe a single audio chunk.
    
    Args:
        chunk_data: Audio segment chunk
        chunk_index: Index of the chunk for identification
        
    Returns:
        tuple: (chunk_index, transcribed_text)
    """
    recognizer = sr.Recognizer()
    
    # Create a temporary file for this chunk
    temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    temp_filename = temp_file.name
    temp_file.close()
    
    try:
        # Export chunk to temporary WAV file
        chunk_data.export(temp_filename, format="wav")
        
        # Transcribe chunk
        with sr.AudioFile(temp_filename) as source:
            audio_data = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_data)
                return chunk_index, text
            except sr.UnknownValueError:
                return chunk_index, "[Inaudible]"
            except sr.RequestError as e:
                return chunk_index, f"[Error: {str(e)}]"
    finally:
        # Remove temporary file
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

def transcribe_large_audio(audio_file, chunk_duration_ms=30000, max_workers=None):
    """
    Transcribe audio by breaking it into manageable chunks and processing in parallel.
    
    Args:
        audio_file: Path to the audio file
        chunk_duration_ms: Chunk size in milliseconds
        max_workers: Maximum number of thread workers (None = auto)
        
    Returns:
        Full transcription text
    """
    # Load audio file
    audio = AudioSegment.from_file(audio_file)
    
    # Get duration
    duration_ms = len(audio)
    
    # Calculate number of chunks
    chunks = [(i, audio[i:i + chunk_duration_ms]) 
              for i in range(0, duration_ms, chunk_duration_ms)]
    
    # Initialize result dictionary to maintain order
    transcription_dict = {}
    
    # Process chunks in parallel
    with tqdm(total=len(chunks), desc="Transcribing") as pbar:
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_chunk = {
                executor.submit(transcribe_chunk, chunk_data, chunk_idx): chunk_idx 
                for chunk_idx, chunk_data in chunks
            }
            
            # Process results as they complete
            for future in concurrent.futures.as_completed(future_to_chunk):
                chunk_idx = future_to_chunk[future]
                try:
                    idx, text = future.result()
                    transcription_dict[idx] = text
                except Exception as e:
                    transcription_dict[chunk_idx] = f"[Error: {str(e)}]"
                pbar.update(1)
    
    # Join chunks in original order
    ordered_transcription = [transcription_dict[i] for i, _ in sorted(chunks)]
    return " ".join(ordered_transcription)

def main():
    parser = argparse.ArgumentParser(description="Convert audio files to text using parallel processing")
    parser.add_argument("input_file", help="Path to the input audio file")
    parser.add_argument("-o", "--output", help="Path to the output text file. If not specified, prints to console")
    parser.add_argument("-c", "--chunk-size", type=int, default=30000,
                       help="Size of audio chunks in milliseconds (default: 30000)")
    parser.add_argument("-w", "--workers", type=int, default=None,
                       help="Number of worker threads (default: auto)")
    
    args = parser.parse_args()
    
    # Check if file exists
    if not os.path.exists(args.input_file):
        print(f"Error: File '{args.input_file}' not found")
        return
    
    print(f"Processing audio file: {args.input_file}")
    
    # Convert to WAV if necessary
    if not args.input_file.lower().endswith('.wav'):
        print("Converting audio to WAV format...")
        temp_wav = "temp_audio.wav"
        convert_audio_to_wav(args.input_file, temp_wav)
        audio_file = temp_wav
    else:
        audio_file = args.input_file
    
    # Transcribe audio
    transcription = transcribe_large_audio(audio_file, args.chunk_size, args.workers)
    
    # Clean up temporary file
    if audio_file != args.input_file:
        os.remove(audio_file)
    
    # Output result
    if args.output:
        with open(args.output, 'w') as f:
            f.write(transcription)
        print(f"Transcription saved to: {args.output}")
    else:
        print("\nTranscription:")
        print(transcription)

if __name__ == "__main__":
    main()