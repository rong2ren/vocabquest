#!/usr/bin/env python3
"""
Script to extract vocabulary words and generate audio pronunciations
"""

import json
import os

def extract_vocabulary_words(dataset_path):
    """Extract all vocabulary words from the dataset"""
    with open(dataset_path, 'r') as f:
        data = json.load(f)
    
    words = []
    for item in data['vocabulary']:
        words.append({
            'id': item['id'],
            'word': item['word'],
            'definition': item['definition'],
            'example_sentence': item['example_sentence']
        })
    
    return words

def prepare_audio_data(words):
    """Prepare data for batch audio generation"""
    text_list = []
    output_file_list = []
    
    for word_data in words:
        word = word_data['word']
        word_id = word_data['id']
        
        # Use just the word for pronunciation
        text_list.append(word)
        
        # Create output filename
        output_filename = f"audio/word_{word_id:03d}_{word.lower().replace(' ', '_')}.mp3"
        output_file_list.append(output_filename)
    
    return text_list, output_file_list

def main():
    # Extract vocabulary words
    print("Extracting vocabulary words from dataset...")
    words = extract_vocabulary_words('/workspace/data/ssat_vocabulary_dataset.json')
    print(f"Found {len(words)} words to process")
    
    # Prepare audio generation data
    text_list, output_file_list = prepare_audio_data(words)
    
    # Create audio directory if it doesn't exist
    os.makedirs('/workspace/audio', exist_ok=True)
    
    print("\nPrepared for audio generation:")
    print(f"Number of words: {len(text_list)}")
    print(f"Sample words: {text_list[:5]}")
    print(f"Sample output files: {output_file_list[:5]}")
    
    # Save the prepared data for use with the batch_text_to_audio function
    audio_data = {
        'words': words,
        'text_list': text_list,
        'output_file_list': output_file_list
    }
    
    with open('/workspace/audio_generation_data.json', 'w') as f:
        json.dump(audio_data, f, indent=2)
    
    print(f"\nAudio generation data saved to audio_generation_data.json")
    return audio_data

if __name__ == "__main__":
    audio_data = main()