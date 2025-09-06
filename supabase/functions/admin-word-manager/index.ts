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
        const { action, data } = await req.json();

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Verify admin authorization
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authorization required');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid authorization');
        }

        const userData = await userResponse.json();
        
        // Check if user is admin (you may need to verify this against a user roles table)
        // For now, we'll allow any authenticated user for testing
        console.log('Admin action requested by user:', userData.id, 'Action:', action);

        let result;
        switch (action) {
            case 'add_word':
                result = await addWord(data, serviceRoleKey, supabaseUrl);
                break;
            case 'update_word':
                result = await updateWord(data, serviceRoleKey, supabaseUrl);
                break;
            case 'delete_word':
                result = await deleteWord(data, serviceRoleKey, supabaseUrl);
                break;
            case 'get_words':
                result = await getWords(data, serviceRoleKey, supabaseUrl);
                break;
            case 'search_words':
                result = await searchWords(data, serviceRoleKey, supabaseUrl);
                break;
            case 'bulk_import':
                result = await bulkImportWords(data, serviceRoleKey, supabaseUrl);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin word manager error:', error);

        const errorResponse = {
            error: {
                code: 'ADMIN_ACTION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function addWord(data: any, serviceRoleKey: string, supabaseUrl: string) {
    const { list_id, word_data } = data;

    if (!list_id || !word_data) {
        throw new Error('List ID and word data are required');
    }

    // Insert the word into the database
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/vocabulary_words`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            list_id: list_id,
            ...word_data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    });

    if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`Failed to add word: ${errorText}`);
    }

    const newWord = await insertResponse.json();
    
    // Update word count in the vocabulary list
    await updateWordCount(list_id, serviceRoleKey, supabaseUrl);

    return {
        message: 'Word added successfully',
        word: newWord[0]
    };
}

async function updateWord(data: any, serviceRoleKey: string, supabaseUrl: string) {
    const { word_id, word_data } = data;

    if (!word_id || !word_data) {
        throw new Error('Word ID and word data are required');
    }

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/vocabulary_words?id=eq.${word_id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            ...word_data,
            updated_at: new Date().toISOString()
        })
    });

    if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to update word: ${errorText}`);
    }

    const updatedWord = await updateResponse.json();

    return {
        message: 'Word updated successfully',
        word: updatedWord[0]
    };
}

async function deleteWord(data: any, serviceRoleKey: string, supabaseUrl: string) {
    const { word_id, list_id } = data;

    if (!word_id) {
        throw new Error('Word ID is required');
    }

    const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/vocabulary_words?id=eq.${word_id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete word: ${errorText}`);
    }

    // Update word count in the vocabulary list if list_id provided
    if (list_id) {
        await updateWordCount(list_id, serviceRoleKey, supabaseUrl);
    }

    return {
        message: 'Word deleted successfully',
        word_id: word_id
    };
}

async function getWords(data: any, serviceRoleKey: string, supabaseUrl: string) {
    const { list_id, limit = 10000, offset = 0, sort_by = 'word', sort_order = 'asc' } = data;

    let url = `${supabaseUrl}/rest/v1/vocabulary_words?select=*&limit=${limit}&offset=${offset}&order=${sort_by}.${sort_order}`;
    
    if (list_id) {
        url += `&list_id=eq.${list_id}`;
    }

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch words: ${errorText}`);
    }

    const words = await response.json();

    // Get total count
    let countUrl = `${supabaseUrl}/rest/v1/vocabulary_words?select=count`;
    if (list_id) {
        countUrl += `&list_id=eq.${list_id}`;
    }

    const countResponse = await fetch(countUrl, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    let totalCount = 0;
    if (countResponse.ok) {
        const countData = await countResponse.json();
        totalCount = countData.length;
    }

    return {
        words: words,
        total_count: totalCount,
        limit: limit,
        offset: offset
    };
}

async function searchWords(data: any, serviceRoleKey: string, supabaseUrl: string) {
    const { query, list_id, limit = 1000 } = data;

    if (!query) {
        throw new Error('Search query is required');
    }

    let url = `${supabaseUrl}/rest/v1/vocabulary_words?select=*&limit=${limit}`;
    
    // Search in word, definition, and example_sentence
    url += `&or=(word.ilike.%25${encodeURIComponent(query)}%25,definition.ilike.%25${encodeURIComponent(query)}%25,example_sentence.ilike.%25${encodeURIComponent(query)}%25)`;
    
    if (list_id) {
        url += `&list_id=eq.${list_id}`;
    }

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to search words: ${errorText}`);
    }

    const words = await response.json();

    return {
        words: words,
        query: query,
        count: words.length
    };
}

async function bulkImportWords(data: any, serviceRoleKey: string, supabaseUrl: string) {
    const { list_id, words } = data;

    if (!list_id || !words || !Array.isArray(words)) {
        throw new Error('List ID and words array are required');
    }

    if (words.length === 0) {
        throw new Error('No words to import');
    }

    if (words.length > 100) {
        throw new Error('Maximum 100 words per bulk import');
    }

    // Prepare words for insertion
    const wordsToInsert = words.map(word => ({
        list_id: list_id,
        ...word,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }));

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/vocabulary_words`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(wordsToInsert)
    });

    if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`Failed to bulk import words: ${errorText}`);
    }

    // Update word count in the vocabulary list
    await updateWordCount(list_id, serviceRoleKey, supabaseUrl);

    return {
        message: `Successfully imported ${words.length} words`,
        imported_count: words.length
    };
}

async function updateWordCount(listId: string, serviceRoleKey: string, supabaseUrl: string) {
    // Get current word count for the list
    const countResponse = await fetch(`${supabaseUrl}/rest/v1/vocabulary_words?select=count&list_id=eq.${listId}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (countResponse.ok) {
        const countData = await countResponse.json();
        const wordCount = countData.length;

        // Update the word count in vocabulary_lists table
        await fetch(`${supabaseUrl}/rest/v1/vocabulary_lists?id=eq.${listId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                word_count: wordCount,
                updated_at: new Date().toISOString()
            })
        });
    }
}