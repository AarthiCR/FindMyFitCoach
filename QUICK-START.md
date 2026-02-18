# 🚀 Quick Deployment Commands

## First Time Setup

```powershell
# 1. Install dependencies
cd functions
npm install
cd ..

# 2. Set Gemini API key
firebase functions:secrets:set GEMINI_API_KEY
# Paste: AIzaSyBF6UrK_m0oDstXD1EkpQTryWiy440x0S8

# 3. Set OpenAI API key
firebase functions:secrets:set OPENAI_API_KEY
# Paste: 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

# 4. Deploy everything
firebase deploy
```

## What You Get

✅ **Dual AI Support**: OpenAI + Gemini
✅ **Auto Fallback**: If one fails, tries the other
✅ **Secure**: API keys hidden from users
✅ **No Cache Issues**: Always latest code
✅ **Cost Optimized**: Uses free Gemini first

## Key Features

- **Primary Provider**: Gemini (FREE - 15 req/min)
- **Backup Provider**: OpenAI (Paid - more reliable)
- **Fallback Workouts**: If both fail
- **Provider Logs**: See which AI responded

## Future Updates

```powershell
# Update code only (no API key change)
firebase deploy --only hosting

# Update function code or API keys
firebase deploy --only functions

# Update everything
firebase deploy
```

## View Logs

```powershell
firebase functions:log
```

## Done! 🎉

Your app is now production-ready with dual AI providers!
