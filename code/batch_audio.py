#!/usr/bin/env python3
"""
Script to generate audio pronunciations for vocabulary words in batches
"""

import json

def load_audio_data():
    """Load the prepared audio generation data"""
    with open('/workspace/audio_generation_data.json', 'r') as f:
        return json.load(f)

def create_batches(items, batch_size):
    """Split items into batches of specified size"""
    for i in range(0, len(items), batch_size):
        yield items[i:i + batch_size]

def main():
    # Load data
    audio_data = load_audio_data()
    text_list = audio_data['text_list']
    output_file_list = audio_data['output_file_list']
    
    print(f"Total words to generate audio for: {len(text_list)}")
    
    # Create batches of 50 words (manageable size)
    batch_size = 50
    text_batches = list(create_batches(text_list, batch_size))
    output_batches = list(create_batches(output_file_list, batch_size))
    
    print(f"Creating {len(text_batches)} batches of up to {batch_size} words each")
    
    for i, (text_batch, output_batch) in enumerate(zip(text_batches, output_batches)):
        print(f"\nBatch {i+1}: Words {i*batch_size+1} to {min((i+1)*batch_size, len(text_list))}")
        print(f"Sample words: {text_batch[:3]}...")
        print(f"Batch size: {len(text_batch)} words")
    
    return text_batches, output_batches

if __name__ == "__main__":
    text_batches, output_batches = main()
