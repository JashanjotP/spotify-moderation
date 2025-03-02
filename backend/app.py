from flask import Flask, request, jsonify
from flask_cors import CORS
from moderator import TranscriptModerator
import json
import requests

app = Flask(__name__)
CORS(app)

@app.route('/process-transcript', methods=['POST'])
def process_transcript():
    data = request.get_json()
    transcript = data.get('transcript', '')

    # Here you can add any processing logic for the transcript
    moderator = TranscriptModerator(chunk_size=600, overlap=100)
    report = moderator.generate_moderation_report(
        transcript, 
        "moderation_report.json", 
        max_workers=5
    )
    
    # Read the generated moderation report from the file
    try:
        with open("moderation_report.json", "r") as report_file:
            report_json = json.load(report_file)
    except Exception as e:
        return jsonify({
            "error": "Failed to read moderation report",
            "message": str(e)
        }), 500

    return jsonify(report_json)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
