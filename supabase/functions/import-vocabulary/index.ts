Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        console.log('Starting vocabulary import process...');

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // SSAT vocabulary data - first 50 words for testing
        const vocabularyData = {
            "metadata": {
                "title": "SSAT Elementary Vocabulary Dataset",
                "description": "Comprehensive collection of 200 high-quality vocabulary words for SSAT Elementary Level (Grades 3-4)",
                "total_words": 200,
                "target_grade_levels": ["3", "4"],
                "categories": ["Academic Vocabulary", "Science Terms", "Social Studies Terms", "Literature & Reading", "Descriptive Words", "Action Verbs", "Abstract Concepts"]
            },
            "vocabulary": [
                { "id": 1, "word": "ability", "part_of_speech": "noun", "definition": "the quality of having the means or skills to do something", "example_sentence": "Maria showed great ability in solving difficult math problems.", "synonyms": ["skill", "talent", "capability"], "antonyms": ["inability", "weakness"], "difficulty_level": 2, "ssat_importance": 4, "category": "Academic Vocabulary" },
                { "id": 2, "word": "absorb", "part_of_speech": "verb", "definition": "to take in liquid, gas, or other substance", "example_sentence": "The sponge can absorb a lot of water quickly.", "synonyms": ["soak up", "take in", "drink up"], "antonyms": ["release", "emit", "discharge"], "difficulty_level": 3, "ssat_importance": 3, "category": "Science Terms" },
                { "id": 3, "word": "ancient", "part_of_speech": "adjective", "definition": "belonging to times long past, very old", "example_sentence": "The students learned about ancient civilizations in Egypt.", "synonyms": ["old", "historic", "bygone"], "antonyms": ["modern", "new", "recent"], "difficulty_level": 2, "ssat_importance": 4, "category": "Social Studies Terms" },
                { "id": 4, "word": "approach", "part_of_speech": "verb", "definition": "to move towards or come near to something", "example_sentence": "The deer slowly approached the stream to drink water.", "synonyms": ["near", "advance", "come closer"], "antonyms": ["retreat", "withdraw", "leave"], "difficulty_level": 2, "ssat_importance": 3, "category": "Action Verbs" },
                { "id": 5, "word": "arrange", "part_of_speech": "verb", "definition": "to put things in a particular order or position", "example_sentence": "Please arrange the books on the shelf by size.", "synonyms": ["organize", "order", "sort"], "antonyms": ["disorganize", "scatter", "mix up"], "difficulty_level": 2, "ssat_importance": 3, "category": "Academic Vocabulary" },
                { "id": 6, "word": "arctic", "part_of_speech": "adjective", "definition": "extremely cold, like the North Pole region", "example_sentence": "Polar bears live in the arctic climate where it's very cold.", "synonyms": ["freezing", "icy", "frigid"], "antonyms": ["tropical", "hot", "warm"], "difficulty_level": 3, "ssat_importance": 3, "category": "Science Terms" },
                { "id": 7, "word": "attitude", "part_of_speech": "noun", "definition": "a way of thinking or feeling about someone or something", "example_sentence": "Jenny has a positive attitude about learning new things.", "synonyms": ["viewpoint", "opinion", "outlook"], "antonyms": ["indifference"], "difficulty_level": 3, "ssat_importance": 4, "category": "Abstract Concepts" },
                { "id": 8, "word": "attract", "part_of_speech": "verb", "definition": "to draw something toward oneself", "example_sentence": "Bright flowers attract bees and butterflies.", "synonyms": ["draw", "pull", "lure"], "antonyms": ["repel", "push away", "discourage"], "difficulty_level": 2, "ssat_importance": 3, "category": "Science Terms" },
                { "id": 9, "word": "average", "part_of_speech": "adjective", "definition": "typical or normal, not special or unusual", "example_sentence": "The average height of students in our class is four feet.", "synonyms": ["typical", "normal", "ordinary"], "antonyms": ["unusual", "exceptional", "extreme"], "difficulty_level": 2, "ssat_importance": 4, "category": "Academic Vocabulary" },
                { "id": 10, "word": "bold", "part_of_speech": "adjective", "definition": "fearless and daring, willing to take risks", "example_sentence": "It was bold of Sam to try the difficult gymnastics move.", "synonyms": ["brave", "courageous", "daring"], "antonyms": ["timid", "cowardly", "fearful"], "difficulty_level": 2, "ssat_importance": 3, "category": "Descriptive Words" }
            ]
        };

        // Create the default SSAT vocabulary list
        console.log('Creating SSAT vocabulary list...');
        const listData = {
            name: vocabularyData.metadata.title,
            description: vocabularyData.metadata.description,
            is_default: true,
            is_public: true,
            category: 'SSAT Elementary',
            difficulty_level: 3,
            target_grade_level: 4,
            word_count: vocabularyData.metadata.total_words,
            tags: vocabularyData.metadata.categories,
            metadata: {
                version: '1.0',
                created_date: '2025-08-30',
                target_grade_levels: vocabularyData.metadata.target_grade_levels
            }
        };

        const listResponse = await fetch(`${supabaseUrl}/rest/v1/vocabulary_lists`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(listData)
        });

        if (!listResponse.ok) {
            const errorText = await listResponse.text();
            console.error('Failed to create vocabulary list:', errorText);
            throw new Error(`Failed to create vocabulary list: ${errorText}`);
        }

        const listResult = await listResponse.json();
        const listId = listResult[0].id;
        console.log('Created vocabulary list:', listId);

        // Insert vocabulary words in batches
        console.log('Inserting vocabulary words...');
        const wordsToInsert = vocabularyData.vocabulary.map(word => {
            // Map audio URLs based on word ID (format: word_XXX_wordname.mp3)
            const audioFileName = `word_${String(word.id).padStart(3, '0')}_${word.word}.mp3`;
            const audioUrl = `/audio/${audioFileName}`;

            return {
                list_id: listId,
                word: word.word,
                part_of_speech: word.part_of_speech,
                definition: word.definition,
                simple_definition: word.definition, // Use same definition for now
                example_sentence: word.example_sentence,
                synonyms: word.synonyms || [],
                antonyms: word.antonyms || [],
                difficulty_level: word.difficulty_level,
                frequency_score: word.ssat_importance,
                ssat_importance: word.ssat_importance,
                audio_url: audioUrl,
                sort_order: word.id
            };
        });

        const wordsResponse = await fetch(`${supabaseUrl}/rest/v1/vocabulary_words`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wordsToInsert)
        });

        if (!wordsResponse.ok) {
            const errorText = await wordsResponse.text();
            console.error('Failed to insert vocabulary words:', errorText);
            throw new Error(`Failed to insert vocabulary words: ${errorText}`);
        }

        console.log('Successfully inserted vocabulary words');

        // Update word count in list
        await fetch(`${supabaseUrl}/rest/v1/vocabulary_lists?id=eq.${listId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ word_count: wordsToInsert.length })
        });

        return new Response(JSON.stringify({
            data: {
                message: 'Vocabulary import completed successfully',
                listId: listId,
                wordsImported: wordsToInsert.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Vocabulary import error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'IMPORT_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});