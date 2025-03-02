import { NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';



export async function POST(request: Request) {
	try {
		const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY!;
		const client = new AssemblyAI({
			apiKey: ASSEMBLYAI_API_KEY
		});
		
		
		const formData = await request.formData();
		const audioFile = formData.get('audio') as File;
		

		if (!audioFile) {
			return NextResponse.json(
				{ error: 'No audio file provided' },
				{ status: 400 }
			);
		}

		// Convert File to ArrayBuffer and then to Buffer
		const arrayBuffer = await audioFile.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Create transcription using the SDK
		const transcript = await client.transcripts.transcribe({
			audio: buffer
		});

		// Return the transcribed text
		const flaskUrl =  'http://127.0.0.1:5000/process-transcript';
		const response = await fetch(flaskUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ transcript: transcript.text })
		});

		if (!response.ok) {
		throw new Error('Failed to process the transcript with Flask API');
		}

		const flaskResponse = await response.json();
		console.log('Flask Response:', flaskResponse);

		// Determine episode name (use provided name or extract from transcript)
		
		// Calculate risk score based on problematic sections
		
		// Prepare data for make.com
		
		
		// Send data to make.com asynchronously (don't await to avoid delaying response)
		

		return NextResponse.json({
			text: transcript.text,
			flaskResponse,
			
		});

	} catch (error) {
		console.error('Transcription error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
