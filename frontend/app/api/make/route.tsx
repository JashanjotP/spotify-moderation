import { NextResponse } from 'next/server';

// Function to send data to make.com
async function sendToMake(data: {
	episodeName: string;
	riskScore: number;
	flaggedContent: string;
	misinformationContent: string;
	transcript: string;
	timestamp: string;
    email: string; 
}) {
	try {
		// Replace with your actual make.com webhook URL
		const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
		
		if (!makeWebhookUrl) {
			console.error('Make.com webhook URL not configured');
			return false;
		}
		
		const response = await fetch(makeWebhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data)
		});
		
		if (!response.ok) {
			throw new Error(`Failed to send data to make.com: ${response.statusText}`);
		}
		
		console.log('Successfully sent data to make.com');
		return true;
	} catch (error) {
		console.error('Error sending data to make.com:', error);
		return false;
	}
}

// Calculate risk score based on problematic sections
function calculateRiskScore(problematicSections: any[]): number {
	if (!problematicSections || problematicSections.length === 0) {
		return 0;
	}
	
	// Extract all scores from flagged categories
	const allScores: number[] = [];
	
	problematicSections.forEach(section => {
		if (section.flagged_lines) {
			section.flagged_lines.forEach((line: any) => {
				Object.values(line.flagged_categories).forEach((category: any) => {
					if (category.score) {
						allScores.push(category.score);
					}
				});
			});
		}
	});
	
	// If no scores found, return 0
	if (allScores.length === 0) {
		return 0;
	}
	
	// Calculate average score and convert to percentage
	const averageScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
	return Math.round(averageScore * 100);
}

// Extract episode name from transcript (simple implementation)
function extractEpisodeName(transcript: string): string {
	// Default episode name with timestamp
	const defaultName = `Podcast Episode - ${new Date().toISOString().split('T')[0]}`;
	
	if (!transcript) {
		return defaultName;
	}
	
	// Try to find a title pattern in the first few lines
	// This is a simple implementation - you might want to improve this logic
	const lines = transcript.split('\n').slice(0, 10);
	
	for (const line of lines) {
		// Look for patterns like "Episode: Title" or "Title - Episode X"
		if (line.includes('Episode:') || line.includes('Title:') || 
				(line.includes('Episode') && line.includes('-'))) {
			return line.trim();
		}
	}
	
	return defaultName;
}

export async function POST(request: Request) {
	try {
		

		// Return the transcribed text
		

		const { fullTranscriptionResponse, providedEpisodeName, email } = await request.json();
        
        const text = fullTranscriptionResponse.text;
        const flaskResponse = fullTranscriptionResponse.flaskResponse;

		// Determine episode name (use provided name or extract from transcript)
		const episodeName = providedEpisodeName || extractEpisodeName(text || '');
		
		// Calculate risk score based on problematic sections
		const riskScore = calculateRiskScore(flaskResponse.problematic_sections);
		
		// Prepare data for make.com
		const makeData = {
			episodeName,
			riskScore,
			flaggedContent: flaskResponse.problematic_sections.flatMap(section => 
				(section.flagged_lines || []).map(line => ({
					text: line.text,
					categories: Object.entries(line.flagged_categories)
						.map(([category, data]: [string, any]) => 
							`${category}: ${Math.round(data.score * 100)}%`)
						.join(', ')
				}))
			).map(item => `Text: ${item.text}\nCategories: ${item.categories}`).join('\n\n'),
			misinformationContent: flaskResponse.misinformation_sections.map(section => 
				`Text: ${section.text}\nConfidence: ${Math.round(section.misinformation_details.confidence * 100)}%\n\n Explanation:\n\n ${section.misinformation_details.explanation}`
			).join('\n\n'),
			transcript: text || '',
			timestamp: flaskResponse.timestamp || new Date().toISOString(),
			email: email
		};
		
		// Send data to make.com asynchronously (don't await to avoid delaying response)
		sendToMake(makeData).then(success => {
			if (success) {
				console.log('Data successfully sent to make.com');
			} else {
				console.error('Failed to send data to make.com');
			}

		});

		return NextResponse.json({
			text: text,
			flaskResponse,
			makeIntegration: {
				episodeName,
				riskScore,
				sentToMake: true
			}
		});

	} catch (error) {
		console.error('Transcription error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
