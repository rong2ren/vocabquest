Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { word, targetGrade = 4 } = await req.json();

        if (!word) {
            throw new Error('Word is required');
        }

        console.log(`Generating AI content for word: ${word}, target grade: ${targetGrade}`);

        const wordData = await generateWithGemini(word, targetGrade);

        return new Response(JSON.stringify({
            data: wordData
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI word generation error:', error);

        const errorResponse = {
            error: {
                code: 'AI_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Gemini AI Integration using REST API
async function generateWithGemini(word: string, targetGrade: number) {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required. Get your free API key at: https://makersuite.google.com/app/apikey');
    }

    const prompt = `Create educational vocabulary content for the word "${word}" for grade ${targetGrade} students (ages 8-12).

Please provide a JSON response with the following structure:
{
  "word": "${word}",
  "part_of_speech": "noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection",
  "definition": "Clear, age-appropriate definition in simple language",
  "example_sentence": "Educational example sentence suitable for grade ${targetGrade}",
  "synonyms": ["synonym1", "synonym2", "synonym3"],
  "antonyms": ["antonym1", "antonym2"],
  "difficulty_level": 1-5,
  "ssat_importance": 1-5,
  "pronunciation_guide": "Phonetic pronunciation guide",
  "usage_notes": "Brief note about when/how to use this word"
}

Guidelines:
- Definition should be clear and age-appropriate for grade ${targetGrade}
- Example sentence should be educational and relatable to school/learning
- Difficulty level: 1=very easy, 5=very difficult for grade ${targetGrade}
- SSAT importance: 1=rarely tested, 5=essential for SSAT
- Pronunciation guide should be simple phonetic spelling
- Usage notes should be brief and helpful

Return only the JSON, no additional text.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error response:', errorText);
            throw new Error(`Gemini API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Unexpected Gemini response structure:', data);
            throw new Error('Unexpected response structure from Gemini API');
        }
        
        const text = data.candidates[0].content.parts[0].text;
        console.log('Gemini raw response:', text);
        
        // Parse the JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response. Raw response: ' + text);
        }
        
        const wordData = JSON.parse(jsonMatch[0]);
        
        // Validate and format the response
        return validateAndFormatWordData(wordData);
        
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error(`Gemini API error: ${error.message}`);
    }
}

// Helper function to validate and format word data
function validateAndFormatWordData(wordData: any) {
    // Validate required fields
    const requiredFields = ['word', 'part_of_speech', 'definition', 'example_sentence'];
    for (const field of requiredFields) {
        if (!wordData[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    
    // Ensure arrays are properly formatted
    wordData.synonyms = Array.isArray(wordData.synonyms) ? wordData.synonyms : [];
    wordData.antonyms = Array.isArray(wordData.antonyms) ? wordData.antonyms : [];
    
    // Ensure numeric fields are within valid ranges
    wordData.difficulty_level = Math.min(5, Math.max(1, parseInt(wordData.difficulty_level) || 3));
    wordData.ssat_importance = Math.min(5, Math.max(1, parseInt(wordData.ssat_importance) || 3));
    
    // Add frequency score if not present
    wordData.frequency_score = wordData.frequency_score || Math.min(5, Math.max(1, Math.floor(Math.random() * 3) + 2));
    
    return wordData;
}
