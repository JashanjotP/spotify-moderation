import assemblyai as aai

aai.settings.api_key = ""
transcriber = aai.Transcriber()

transcript = transcriber.transcribe("./audio.mp4")
# transcript = transcriber.transcribe("./my-local-audio-file.wav")

with open("transcript.txt", "w") as f:
    f.write(transcript.text)