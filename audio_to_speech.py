import os
import argparse
import speech_recognition as sr
from pydub import AudioSegment
from tqdm import tqdm

def convert_audio_to_wav(input_file, output_file):
    """Convert various audio formats to WAV for speech recognition."""
    audio = AudioSegment.from_file(input_file)
    audio.export(output_file, format="wav")
    return output_file

def transcribe_large_audio(audio_file, chunk_duration_ms=30000):
    """
    Transcribe audio by breaking it into manageable chunks.
    
    Args:
        audio_file: Path to the audio file
        chunk_duration_ms: Chunk size in milliseconds
        
    Returns:
        Full transcription text
    """
    # Initialize recognizer
    recognizer = sr.Recognizer()
    
    # Load audio file
    audio = AudioSegment.from_file(audio_file)
    
    # Get duration
    duration_ms = len(audio)
    
    # Initialize result
    transcription = []
    
    # Process audio in chunks
    with tqdm(total=duration_ms//chunk_duration_ms, desc="Transcribing") as pbar:
        for i in range(0, duration_ms, chunk_duration_ms):
            # Extract chunk
            chunk = audio[i:i + chunk_duration_ms]
            
            # Export chunk to temporary WAV file
            chunk_filename = "temp_chunk.wav"
            chunk.export(chunk_filename, format="wav")
            
            # Transcribe chunk
            with sr.AudioFile(chunk_filename) as source:
                audio_data = recognizer.record(source)
                try:
                    text = recognizer.recognize_google(audio_data)
                    transcription.append(text)
                except sr.UnknownValueError:
                    transcription.append("[Inaudible]")
                except sr.RequestError as e:
                    transcription.append(f"[Error: {str(e)}]")
            
            # Remove temporary file
            os.remove(chunk_filename)
            
            # Update progress bar
            pbar.update(1)
    
    # Join chunks
    return " ".join(transcription)

def main():
    parser = argparse.ArgumentParser(description="Convert audio files to text")
    parser.add_argument("input_file", help="Path to the input audio file")
    parser.add_argument("-o", "--output", help="Path to the output text file. If not specified, prints to console")
    parser.add_argument("-c", "--chunk-size", type=int, default=30000, 
                        help="Size of audio chunks in milliseconds (default: 30000)")
    
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
    transcription = transcribe_large_audio(audio_file, args.chunk_size)
    
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