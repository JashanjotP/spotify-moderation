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
		console.log('Transcript:', transcript.text);
		return NextResponse.json({
			text: transcript.text
		});

	} catch (error) {
		console.error('Transcription error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
