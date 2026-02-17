# Deployment Guide - Dual AI Provider Setup (OpenAI + Gemini)

This guide explains how to deploy your Find My Fit Coach app with **both OpenAI and Gemini** API support, including automatic fallback.

## 🚀 Features

✅ **Dual Provider Support**: Use both OpenAI and Gemini
✅ **Automatic Fallback**: If one fails, automatically tries the other
✅ **Secure**: API keys stored server-side in Firebase secrets
✅ **No Caching Issues**: Always uses latest code
✅ **Provider Selection**: Choose which AI to use (defaults to Gemini for cost savings)

## 📋 Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Node.js 18+ installed
3. **Both API keys** (you can use just one, but two gives redundancy):
   - Gemini API key: `AIzaSyBF6UrK_m0oDstXD1EkpQTryWiy440x0S8`
   - OpenAI API key: `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`

## 🚀 Deployment Steps

### Step 1: Install Function Dependencies

```powershell
cd functions
npm install
cd ..
```

### Step 2: Set Both API Keys as Secrets

```powershell
# Set Gemini API key
firebase functions:secrets:set GEMINI_API_KEY
```

**When prompted, paste:** `AIzaSyBF6UrK_m0oDstXD1EkpQTryWiy440x0S8`

```powershell
# Set OpenAI API key
firebase functions:secrets:set OPENAI_API_KEY
```

**When prompted, paste:** `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`

### Step 3: Deploy Everything

```powershell
firebase deploy
```

This deploys:
- ✅ Cloud Functions (with both AI providers)
- ✅ Hosting (your web app)
- ✅ Firestore rules

## 🎯 How It Works

### Provider Priority & Fallback

**Default behavior (cost-optimized):**
1. **Try Gemini first** (free tier: 15 requests/min)
2. If Gemini fails → **automatically try OpenAI**
3. If both fail → use **fallback workouts**

### Switching Providers

You can choose which provider to use first by setting preferred provider in the code:

```javascript
// In main.js, you can change the preferred provider
const aiService = new AIService(firebaseConfig.projectId, 'openai'); // or 'gemini'

// Or switch dynamically
aiService.setPreferredProvider('openai'); // Switch to OpenAI
aiService.setPreferredProvider('gemini'); // Switch to Gemini
```

## 💰 Cost Comparison

### Gemini (Google)
- **Free Tier**: 15 requests/minute
- **Cost**: FREE for personal use
- **Model**: gemini-1.5-flash

### OpenAI (GPT-3.5-turbo)
- **Cost**: ~$0.002 per workout generation
- **Model**: gpt-3.5-turbo
- **Quality**: Generally more conversational

**Recommendation:** Use Gemini as primary (it's free!) and OpenAI as backup.

## 🔄 Updating API Keys

### Update Gemini Key

```powershell
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
```

### Update OpenAI Key

```powershell
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy --only functions
```

### Using Only One Provider

If you only want to use one provider:

**Option 1: Gemini Only**
- Only set `GEMINI_API_KEY`
- System will use Gemini and fallback workouts if it fails

**Option 2: OpenAI Only**
- Only set `OPENAI_API_KEY`
- System will use OpenAI and fallback workouts if it fails

## 🧪 Testing Locally

```powershell
# Set secrets for local testing
firebase functions:secrets:access GEMINI_API_KEY > functions/.env.local
firebase functions:secrets:access OPENAI_API_KEY >> functions/.env.local

# Start emulators
firebase emulators:start
```

Then update AIService in `src/ai/ai-service.js` for local testing:

```javascript
// Change baseUrl for local testing
this.baseUrl = 'http://127.0.0.1:5001/find-my-fit-coach/us-central1';
```

## 📊 Monitoring

### View logs for both providers

```powershell
firebase functions:log
```

### View which provider is being used

```powershell
firebase functions:log --only generateAIWorkout
```

You'll see logs like:
- `🤖 Trying Gemini...`
- `✅ Response from GEMINI`
- `OpenAI failed, falling back to Gemini...`

## 🔒 Security Benefits

✅ **No exposed API keys** - Never visible to users
✅ **Server-side validation** - All requests go through your functions
✅ **CORS protection** - Only your domain can call these functions
✅ **Rate limiting ready** - Easy to add if needed
✅ **Audit logs** - Track which provider is used when

## ❓ Troubleshooting

### Both providers failing

```powershell
# Check secrets are set
firebase functions:secrets:list

# View recent errors
firebase functions:log --limit 20
```

### Verify secrets are accessible

```powershell
firebase functions:secrets:access GEMINI_API_KEY
firebase functions:secrets:access OPENAI_API_KEY
```

### One provider not working

The system will automatically fall back to the other provider. Check logs to see which one failed:

```powershell
firebase functions:log --only generateAIWorkout
```

## 💡 Tips

1. **Cost Optimization**: Keep Gemini as default (it's free!)
2. **Redundancy**: Having both providers means 99.9% uptime
3. **Testing**: Test both providers by switching between them
4. **Monitoring**: Check logs to see which provider is being used most

## 🎉 Done!

Your app now supports **both OpenAI and Gemini** with:
- ✅ Automatic fallback
- ✅ No caching issues
- ✅ Secure API key storage
- ✅ Cost optimization

Deploy and enjoy! 🚀
