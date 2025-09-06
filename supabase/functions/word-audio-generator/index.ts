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
        const { word, wordId } = await req.json();

        if (!word) {
            throw new Error('Word is required');
        }

        console.log(`Generating audio for word: ${word}, ID: ${wordId}`);

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Generate audio using text-to-speech (simplified simulation)
        const audioFileName = generateAudioFileName(word, wordId);
        const audioUrl = `/audio/${audioFileName}`;

        // In a real implementation, this would:
        // 1. Use a TTS service like ElevenLabs, Google TTS, or Azure Speech
        // 2. Generate actual audio file
        // 3. Upload to Supabase Storage
        // For now, we'll simulate this process

        console.log(`Audio generated: ${audioUrl}`);

        return new Response(JSON.stringify({
            data: {
                audio_url: audioUrl,
                audio_filename: audioFileName,
                word: word,
                status: 'generated'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Audio generation error:', error);

        const errorResponse = {
            error: {
                code: 'AUDIO_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function generateAudioFileName(word: string, wordId?: number): string {
    // Generate consistent filename format
    if (wordId) {
        return `word_${String(wordId).padStart(3, '0')}_${word.toLowerCase()}.mp3`;
    } else {
        // Generate a unique ID for new words
        const timestamp = Date.now();
        return `word_new_${timestamp}_${word.toLowerCase()}.mp3`;
    }
}

// Future enhancement: Integrate with real TTS service
/*
async function generateRealAudio(word: string, serviceRoleKey: string, supabaseUrl: string) {
    // Example integration with ElevenLabs or similar TTS service
    const ttsApiKey = Deno.env.get('TTS_API_KEY');
    
    if (!ttsApiKey) {
        throw new Error('TTS API key not configured');
    }
    
    // Generate audio using TTS service
    const audioResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/voice-id', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ttsApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: word,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
            }
        })
    });
    
    if (!audioResponse.ok) {
        throw new Error('TTS service error');
    }
    
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioData = new Uint8Array(audioBuffer);
    
    // Upload to Supabase Storage
    const fileName = generateAudioFileName(word);
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/vocab-audio/${fileName}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'audio/mpeg',
            'x-upsert': 'true'
        },
        body: audioData
    });
    
    if (!uploadResponse.ok) {
        throw new Error('Audio upload failed');
    }
    
    return `${supabaseUrl}/storage/v1/object/public/vocab-audio/${fileName}`;
}
*/