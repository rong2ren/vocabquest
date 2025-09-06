#!/usr/bin/env python3
"""
Generate audio batch 1: Words 1-50
"""

import json

# Load the audio data
with open('/workspace/audio_generation_data.json', 'r') as f:
    audio_data = json.load(f)

# Get the first batch (words 1-50)
text_batch_1 = audio_data['text_list'][0:50]
output_batch_1 = audio_data['output_file_list'][0:50]

print(f"Batch 1 - Generating audio for {len(text_batch_1)} words:")
print(f"Words: {text_batch_1[:5]}... to {text_batch_1[-3:]}")
print(f"Output files will be saved to audio/ directory")

# Prepare data for the batch_text_to_audio function
batch_1_data = {
    'text_list': text_batch_1,
    'output_file_list': output_batch_1
}

# Save batch data for reference
with open('/workspace/batch_1_data.json', 'w') as f:
    json.dump(batch_1_data, f, indent=2)

print("Ready for audio generation!")
