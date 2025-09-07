#!/bin/bash

# Simple Gemini AI Setup Script for VocabQuest
echo "🤖 Setting up Gemini AI for VocabQuest"
echo "======================================"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""
echo "🔑 Getting Gemini API Key"
echo "1. Go to: https://makersuite.google.com/app/apikey"
echo "2. Sign in with your Google account"
echo "3. Click 'Create API Key'"
echo "4. Copy the API key"
echo ""

read -p "Enter your Gemini API key: " api_key

if [ -z "$api_key" ]; then
    echo "❌ No API key provided. Exiting."
    exit 1
fi

echo "Setting GEMINI_API_KEY..."
supabase secrets set GEMINI_API_KEY=$api_key

if [ $? -eq 0 ]; then
    echo "✅ Gemini API key set successfully!"
else
    echo "❌ Failed to set Gemini API key"
    exit 1
fi

echo ""
echo "🚀 Deploying Gemini AI function..."
supabase functions deploy ai-word-generator-gemini

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update your admin page to use 'ai-word-generator-gemini' instead of 'ai-word-generator'"
    echo "2. Test the AI generation in your admin interface"
    echo "3. Enjoy real AI-generated vocabulary content!"
    echo ""
    echo "💡 To test, try generating content for words like:"
    echo "   - analyze"
    echo "   - demonstrate" 
    echo "   - investigate"
    echo "   - significant"
else
    echo "❌ Failed to deploy AI function"
    echo "Check your Supabase project connection and try again"
fi
