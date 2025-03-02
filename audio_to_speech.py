import assemblyai as aai
from dotenv import load_dotenv
import os

load_dotenv()

aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")
transcriber = aai.Transcriber()

transcript = transcriber.transcribe("./audio.mp4")
# transcript = transcriber.transcribe("./my-local-audio-file.wav")

with open("transcript.txt", "w") as f:
    f.write(transcript.text)