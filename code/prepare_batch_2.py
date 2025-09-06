#!/usr/bin/env python3
"""
Generate batch data for words 51-100
"""

import json

# Load the full audio data
with open('/workspace/audio_generation_data.json', 'r') as f:
    audio_data = json.load(f)

# Get the second batch (words 51-100)
text_batch_2 = audio_data['text_list'][50:100]
output_batch_2 = audio_data['output_file_list'][50:100]

print(f"Batch 2 - Preparing audio for {len(text_batch_2)} words:")
print(f"Words: {text_batch_2[:5]}... to {text_batch_2[-3:]}")

# Prepare batch 2 data
batch_2_data = {
    'text_list': text_batch_2,
    'output_file_list': output_batch_2
}

# Save batch data
with open('/workspace/batch_2_data.json', 'w') as f:
    json.dump(batch_2_data, f, indent=2)

print(f"Batch 2 data prepared with {len(text_batch_2)} words")
print(f"Sample words: {text_batch_2[:3]}")
