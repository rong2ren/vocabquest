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

        // Simple AI-like generation based on word patterns and educational guidelines
        const wordData = await generateWordData(word, targetGrade);

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

// Educational word generation logic optimized for 8-12 year olds
async function generateWordData(word: string, targetGrade: number) {
    const wordLower = word.toLowerCase();
    
    // Determine part of speech based on word patterns
    const partOfSpeech = determinePartOfSpeech(wordLower);
    
    // Generate age-appropriate definition
    const definition = generateDefinition(wordLower, partOfSpeech, targetGrade);
    
    // Generate contextual example sentence
    const exampleSentence = generateExampleSentence(wordLower, partOfSpeech, targetGrade);
    
    // Generate synonyms and antonyms
    const synonyms = generateSynonyms(wordLower, partOfSpeech);
    const antonyms = generateAntonyms(wordLower, partOfSpeech);
    
    // Assess difficulty level (1-5 scale)
    const difficultyLevel = assessDifficulty(wordLower, targetGrade);
    
    // Calculate SSAT importance (1-5 scale)
    const ssatImportance = assessSSATImportance(wordLower, partOfSpeech);
    
    // Generate pronunciation guide
    const pronunciationGuide = generatePronunciationGuide(wordLower);
    
    // Generate usage notes for complex words
    const usageNotes = generateUsageNotes(wordLower, partOfSpeech, difficultyLevel);
    
    return {
        word: word,
        part_of_speech: partOfSpeech,
        definition: definition,
        example_sentence: exampleSentence,
        synonyms: synonyms,
        antonyms: antonyms,
        difficulty_level: difficultyLevel,
        ssat_importance: ssatImportance,
        pronunciation_guide: pronunciationGuide,
        usage_notes: usageNotes,
        frequency_score: Math.min(5, Math.max(1, Math.floor(Math.random() * 3) + 2))
    };
}

function determinePartOfSpeech(word: string): string {
    // Common suffix patterns for part of speech detection
    const suffixPatterns = {
        'noun': ['-tion', '-sion', '-ment', '-ness', '-ity', '-er', '-or', '-ist', '-ism', '-age', '-ure', '-ture'],
        'verb': ['-ate', '-ize', '-ise', '-fy', '-en'],
        'adjective': ['-ful', '-less', '-able', '-ible', '-ous', '-ious', '-ive', '-ic', '-al', '-ed', '-ing'],
        'adverb': ['-ly', '-ward', '-wise']
    };
    
    // Check suffixes
    for (const [pos, suffixes] of Object.entries(suffixPatterns)) {
        for (const suffix of suffixes) {
            if (word.endsWith(suffix.substring(1))) {
                return pos;
            }
        }
    }
    
    // Common word patterns
    const commonWords = {
        'noun': ['ability', 'person', 'place', 'thing', 'idea', 'concept', 'system', 'process', 'method', 'way', 'time', 'year', 'day', 'life', 'work', 'world', 'country', 'area', 'community', 'family', 'group', 'number', 'part', 'point', 'government', 'company', 'problem', 'service'],
        'verb': ['make', 'get', 'go', 'come', 'take', 'see', 'know', 'think', 'look', 'use', 'find', 'give', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call', 'develop', 'create', 'build', 'provide', 'include', 'continue', 'follow', 'learn', 'change', 'lead', 'understand', 'watch', 'move', 'live', 'believe', 'bring', 'happen', 'write', 'sit', 'stand', 'lose', 'pay', 'meet', 'run', 'increase', 'grow', 'open', 'walk', 'win', 'speak', 'stop', 'carry', 'send', 'receive', 'decide', 'support', 'explain', 'agree', 'reach', 'discuss', 'suggest', 'expect', 'produce', 'require', 'raise'],
        'adjective': ['good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same', 'able', 'local', 'sure', 'social', 'late', 'hard', 'far', 'black', 'white', 'red', 'blue', 'hot', 'cold', 'final', 'main', 'free', 'military', 'medical', 'political', 'economic', 'financial', 'international', 'national', 'federal', 'environmental', 'cultural', 'natural', 'human', 'personal', 'individual', 'special', 'available', 'popular', 'strong', 'possible', 'necessary', 'clear', 'real', 'serious', 'common', 'recent', 'current', 'best', 'better', 'full', 'simple', 'easy', 'difficult', 'hard']
    };
    
    for (const [pos, words] of Object.entries(commonWords)) {
        if (words.includes(word)) {
            return pos;
        }
    }
    
    // Default fallback based on word length and complexity
    if (word.length <= 4) return 'noun';
    if (word.includes('ing')) return 'verb';
    if (word.includes('ed')) return 'verb';
    
    return 'noun'; // Default
}

function generateDefinition(word: string, partOfSpeech: string, targetGrade: number): string {
    // Simple definition templates based on part of speech and grade level
    const definitionTemplates = {
        'noun': [
            `a person, place, thing, or idea`,
            `something that is important or useful`,
            `a thing that people use or need`,
            `an object or concept that exists`
        ],
        'verb': [
            `to do something or make something happen`,
            `an action that someone does`,
            `to cause or make something change`,
            `to perform an action or activity`
        ],
        'adjective': [
            `describing how something looks, feels, or acts`,
            `a word that tells us more about something`,
            `describing the quality or nature of something`,
            `telling us what something is like`
        ],
        'adverb': [
            `describing how something is done`,
            `a word that tells us more about an action`,
            `describing when, where, or how something happens`,
            `modifying or describing a verb or action`
        ]
    };
    
    // Create more specific definitions based on common word patterns
    const specificDefinitions: Record<string, string> = {
        // Common academic words
        'analyze': 'to study something carefully to understand its parts',
        'compare': 'to look at how two or more things are similar or different',
        'describe': 'to tell about something using words that help others picture it',
        'explain': 'to make something clear and easy to understand',
        'identify': 'to recognize or name what something is',
        'summarize': 'to tell the main ideas of something in a shorter way',
        
        // Action words
        'create': 'to make something new that did not exist before',
        'develop': 'to grow, change, or make something better over time',
        'establish': 'to start or set up something new',
        'maintain': 'to keep something in good condition',
        'organize': 'to arrange things in a neat and orderly way',
        'participate': 'to take part in an activity with others',
        
        // Descriptive words
        'significant': 'very important or meaningful',
        'appropriate': 'right or suitable for a particular situation',
        'effective': 'working well and getting good results',
        'efficient': 'working in a way that saves time and energy',
        'substantial': 'large in amount, size, or importance',
        'comprehensive': 'including everything that is needed',
        
        // Abstract concepts
        'concept': 'an idea or thought about how something works',
        'principle': 'a basic rule or idea that guides how something works',
        'strategy': 'a plan for achieving a goal',
        'procedure': 'a series of steps to do something correctly',
        'criteria': 'the standards used to judge or evaluate something',
        'perspective': 'a particular way of thinking about or seeing something'
    };
    
    if (specificDefinitions[word]) {
        return specificDefinitions[word];
    }
    
    // Generate based on word patterns and templates
    const templates = definitionTemplates[partOfSpeech] || definitionTemplates['noun'];
    const baseDefinition = templates[Math.floor(Math.random() * templates.length)];
    
    // Customize based on the actual word
    if (word.endsWith('tion') || word.endsWith('sion')) {
        return `the act or process of ${word.replace(/(tion|sion)$/, 'ing').replace(/ation$/, 'ating')}`;
    }
    if (word.endsWith('ment')) {
        return `the result or state of ${word.replace(/ment$/, 'ing')}`;
    }
    if (word.endsWith('ness')) {
        const base = word.replace(/ness$/, '');
        return `the quality of being ${base}`;
    }
    if (word.endsWith('able') || word.endsWith('ible')) {
        return `able to be ${word.replace(/(able|ible)$/, 'ed')}`;
    }
    
    return `${baseDefinition} related to "${word}"`;
}

function generateExampleSentence(word: string, partOfSpeech: string, targetGrade: number): string {
    // Age-appropriate sentence templates
    const sentenceTemplates = {
        'noun': [
            `The {word} was very important in our science class.`,
            `Maria learned about the {word} during her research project.`,
            `Our teacher explained what a {word} means to the whole class.`,
            `The students found the {word} interesting and asked many questions.`,
            `Every {word} in the museum had a story to tell.`
        ],
        'verb': [
            `The students {word} their homework every day after school.`,
            `Maria likes to {word} new things during science experiments.`,
            `Our class will {word} this activity next week.`,
            `It's important to {word} carefully when working on projects.`,
            `The teacher asked us to {word} the information we learned.`
        ],
        'adjective': [
            `The {word} book was Maria's favorite in the library.`,
            `Our science project turned out {word} and colorful.`,
            `The teacher said our work was {word} and well-done.`,
            `The {word} weather made it perfect for outdoor activities.`,
            `Everyone agreed that the presentation was very {word}.`
        ],
        'adverb': [
            `Maria worked {word} on her math problems.`,
            `The students listened {word} to their teacher's instructions.`,
            `Our team completed the project {word} and on time.`,
            `The experiment went {word} as planned.`,
            `Everyone participated {word} in the group discussion.`
        ]
    };
    
    // Specific examples for common academic words
    const specificExamples: Record<string, string> = {
        'analyze': 'The students learned to analyze the data from their science experiment.',
        'compare': 'Maria will compare the two different plant growth methods in her report.',
        'describe': 'The teacher asked the students to describe what they observed during the field trip.',
        'explain': 'Can you explain how the water cycle works to the younger students?',
        'identify': 'The nature guide helped us identify different types of birds in the park.',
        'create': 'Our art class will create a mural for the school hallway.',
        'develop': 'The students helped develop a plan for the school garden project.',
        'organize': 'Maria likes to organize her books by subject and color.',
        'participate': 'All the students were excited to participate in the science fair.',
        'significant': 'The discovery of the old artifacts was significant for our local history.',
        'appropriate': 'The teacher helped us choose appropriate sources for our research.',
        'effective': 'The new study method proved to be very effective for learning vocabulary.',
        'concept': 'The concept of gravity is important in understanding how objects fall.',
        'strategy': 'Our team developed a winning strategy for the quiz competition.'
    };
    
    if (specificExamples[word]) {
        return specificExamples[word];
    }
    
    // Generate from templates
    const templates = sentenceTemplates[partOfSpeech] || sentenceTemplates['noun'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    return template.replace('{word}', word);
}

function generateSynonyms(word: string, partOfSpeech: string): string[] {
    const synonymGroups: Record<string, string[]> = {
        // Common academic words
        'analyze': ['examine', 'study', 'review'],
        'compare': ['contrast', 'match', 'relate'],
        'describe': ['explain', 'tell about', 'show'],
        'identify': ['recognize', 'find', 'name'],
        'create': ['make', 'build', 'form'],
        'develop': ['grow', 'build', 'improve'],
        'organize': ['arrange', 'sort', 'order'],
        'significant': ['important', 'meaningful', 'major'],
        'appropriate': ['suitable', 'proper', 'right'],
        'effective': ['successful', 'working', 'useful'],
        'concept': ['idea', 'thought', 'notion'],
        'strategy': ['plan', 'method', 'approach'],
        
        // Common words
        'big': ['large', 'huge', 'enormous'],
        'small': ['little', 'tiny', 'miniature'],
        'good': ['great', 'excellent', 'wonderful'],
        'bad': ['poor', 'terrible', 'awful'],
        'happy': ['joyful', 'cheerful', 'glad'],
        'sad': ['unhappy', 'gloomy', 'downhearted'],
        'fast': ['quick', 'speedy', 'rapid'],
        'slow': ['sluggish', 'gradual', 'unhurried']
    };
    
    return synonymGroups[word] || []; // Return empty array if no synonyms found
}

function generateAntonyms(word: string, partOfSpeech: string): string[] {
    const antonymGroups: Record<string, string[]> = {
        'big': ['small', 'little', 'tiny'],
        'small': ['big', 'large', 'huge'],
        'good': ['bad', 'poor', 'terrible'],
        'bad': ['good', 'great', 'excellent'],
        'happy': ['sad', 'unhappy', 'gloomy'],
        'sad': ['happy', 'joyful', 'cheerful'],
        'fast': ['slow', 'sluggish', 'gradual'],
        'slow': ['fast', 'quick', 'speedy'],
        'hot': ['cold', 'cool', 'freezing'],
        'cold': ['hot', 'warm', 'boiling'],
        'tall': ['short', 'small', 'low'],
        'short': ['tall', 'high', 'long'],
        'easy': ['hard', 'difficult', 'challenging'],
        'difficult': ['easy', 'simple', 'straightforward'],
        'create': ['destroy', 'demolish', 'break'],
        'organize': ['disorganize', 'mess up', 'scatter'],
        'effective': ['ineffective', 'useless', 'failed']
    };
    
    return antonymGroups[word] || []; // Return empty array if no antonyms found
}

function assessDifficulty(word: string, targetGrade: number): number {
    // Difficulty assessment based on word characteristics
    let difficulty = 2; // Start with moderate difficulty
    
    // Word length factor
    if (word.length <= 4) difficulty -= 1;
    else if (word.length >= 8) difficulty += 1;
    if (word.length >= 12) difficulty += 1;
    
    // Syllable complexity (approximate)
    const vowelCount = (word.match(/[aeiou]/gi) || []).length;
    if (vowelCount >= 4) difficulty += 1;
    
    // Common prefixes/suffixes that increase difficulty
    const complexAffixes = ['un-', 're-', 'pre-', 'anti-', 'inter-', 'trans-', '-tion', '-sion', '-ment', '-ness', '-ity', '-ous', '-ious', '-ical', '-able', '-ible'];
    for (const affix of complexAffixes) {
        if (affix.startsWith('-') && word.endsWith(affix.substring(1))) {
            difficulty += 1;
            break;
        } else if (!affix.startsWith('-') && word.startsWith(affix)) {
            difficulty += 1;
            break;
        }
    }
    
    // Academic vocabulary tends to be more difficult
    const academicWords = ['analyze', 'synthesize', 'evaluate', 'demonstrate', 'illustrate', 'investigate', 'hypothesis', 'concept', 'principle', 'strategy', 'procedure', 'criteria', 'perspective', 'comprehensive', 'substantial', 'significant'];
    if (academicWords.includes(word)) {
        difficulty += 1;
    }
    
    // Adjust for target grade
    if (targetGrade <= 3) difficulty += 1;
    if (targetGrade >= 5) difficulty -= 1;
    
    // Ensure difficulty stays within 1-5 range
    return Math.min(5, Math.max(1, difficulty));
}

function assessSSATImportance(word: string, partOfSpeech: string): number {
    // SSAT importance based on word type and educational value
    const highImportanceWords = [
        'analyze', 'compare', 'describe', 'explain', 'identify', 'summarize',
        'create', 'develop', 'establish', 'maintain', 'organize', 'participate',
        'significant', 'appropriate', 'effective', 'efficient', 'substantial',
        'concept', 'principle', 'strategy', 'procedure', 'criteria', 'perspective',
        'ability', 'ancient', 'approach', 'attitude', 'average', 'climate',
        'culture', 'demonstrate', 'environment', 'evidence', 'experiment',
        'foundation', 'individual', 'population', 'contemporary', 'contribute'
    ];
    
    const moderateImportanceWords = [
        'absorb', 'arrange', 'attract', 'capable', 'consume', 'dominate',
        'emerge', 'encounter', 'external', 'factor', 'guarantee', 'hypothesis',
        'advocate', 'appreciate', 'define', 'oppose'
    ];
    
    if (highImportanceWords.includes(word)) {
        return 4 + Math.floor(Math.random() * 2); // 4-5
    } else if (moderateImportanceWords.includes(word)) {
        return 3 + Math.floor(Math.random() * 2); // 3-4
    } else {
        // Base importance on part of speech and word complexity
        let importance = 2; // Default moderate importance
        
        if (partOfSpeech === 'verb' && word.length >= 6) importance += 1;
        if (partOfSpeech === 'noun' && word.length >= 7) importance += 1;
        if (partOfSpeech === 'adjective' && word.length >= 8) importance += 1;
        
        return Math.min(5, Math.max(1, importance));
    }
}

function generatePronunciationGuide(word: string): string {
    // Simple pronunciation guide for common patterns
    const pronunciationPatterns: Record<string, string> = {
        'analyze': 'AN-uh-lize',
        'compare': 'kum-PAIR',
        'describe': 'dih-SKRIBE',
        'identify': 'eye-DEN-tuh-fye',
        'organize': 'OR-guh-nize',
        'significant': 'sig-NIF-uh-kunt',
        'appropriate': 'uh-PRO-pree-it',
        'concept': 'KON-sept',
        'strategy': 'STRAT-uh-jee',
        'environment': 'en-VYE-run-ment',
        'experiment': 'ik-SPER-uh-ment',
        'demonstrate': 'DEM-un-strate',
        'participate': 'par-TIS-uh-pate'
    };
    
    if (pronunciationPatterns[word]) {
        return pronunciationPatterns[word];
    }
    
    // Generate basic pronunciation guide based on word structure
    let pronunciation = word.toUpperCase();
    
    // Simple syllable breaking for common patterns
    pronunciation = pronunciation.replace(/TION$/, '-SHUN');
    pronunciation = pronunciation.replace(/SION$/, '-ZHUN');
    pronunciation = pronunciation.replace(/MENT$/, '-MENT');
    pronunciation = pronunciation.replace(/NESS$/, '-NES');
    pronunciation = pronunciation.replace(/ING$/, '-ING');
    pronunciation = pronunciation.replace(/ED$/, '-ED');
    
    return pronunciation;
}

function generateUsageNotes(word: string, partOfSpeech: string, difficultyLevel: number): string {
    // Generate usage notes for more complex words
    if (difficultyLevel <= 2) {
        return ''; // Simple words don't need usage notes
    }
    
    const usageNotes: Record<string, string> = {
        'analyze': 'Often used in science and math classes when studying data or problems.',
        'synthesize': 'Means to combine different ideas or information to create something new.',
        'hypothesis': 'A scientific word for an educated guess that can be tested.',
        'significant': 'A formal way to say something is very important or meaningful.',
        'appropriate': 'Used when something is just right for a particular situation.',
        'demonstrate': 'Often used in school when showing how something works.',
        'participate': 'Means to take an active part in something, not just watch.',
        'environment': 'Can mean the natural world or the surroundings where something happens.',
        'contemporary': 'Means happening now or at the same time as something else.',
        'comprehensive': 'Means including everything that is needed - very complete.',
        'substantial': 'A formal way to say something is large or important in size or amount.'
    };
    
    if (usageNotes[word]) {
        return usageNotes[word];
    }
    
    // Generate generic usage notes based on part of speech and difficulty
    if (partOfSpeech === 'adjective' && difficultyLevel >= 4) {
        return 'This describing word is often used in more formal writing and speeches.';
    } else if (partOfSpeech === 'verb' && difficultyLevel >= 4) {
        return 'This action word is commonly used in academic and professional settings.';
    } else if (partOfSpeech === 'noun' && difficultyLevel >= 4) {
        return 'This is an important concept word often used in school subjects.';
    }
    
    return '';
}