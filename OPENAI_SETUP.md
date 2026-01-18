# 🤖 OpenAI Integration Setup

## ✅ What's Done

- ✅ OpenAI SDK installed in backend
- ✅ Server.js updated with OpenAI integration
- ✅ Fallback to mock responses if no API key
- ✅ Uses GPT-4o-mini (fast & cost-effective)

---

## 🔑 Step 1: Get OpenAI API Key

### A. Create OpenAI Account (if needed)

1. Go to https://platform.openai.com/
2. Click **Sign up** (or **Log in**)
3. Complete registration

### B. Add Payment Method

**Important:** OpenAI requires a payment method, but has very low costs:

1. Click your profile (top right)
2. Select **Billing**
3. Add payment method
4. Set usage limits (recommended: $10/month to start)

### C. Create API Key

1. Go to https://platform.openai.com/api-keys
2. Click **+ Create new secret key**
3. Name it: `Travel Atlas Backend`
4. Click **Create secret key**
5. **Copy the key** (starts with `sk-...`)
6. **Save it somewhere safe** - you can't see it again!

---

## 💰 Pricing (Don't Worry, It's Cheap!)

We're using **GPT-4o-mini** which is very affordable:

| Model | Cost per 1M Tokens | Est. per Itinerary |
|-------|-------------------|-------------------|
| GPT-4o-mini | $0.15 input / $0.60 output | ~$0.01 - $0.02 |

**Example costs:**
- 100 itineraries generated: ~$1.50
- 1,000 chat messages: ~$0.50

**Set a budget limit** in OpenAI dashboard to prevent surprises!

---

## 🚀 Step 2: Add to Render

### Option A: Via Render Dashboard (Recommended)

1. Go to https://dashboard.render.com/
2. Click on your **travel-atlas-api** service
3. Click **Environment** tab in left sidebar
4. Click **Add Environment Variable**
5. Fill in:
   ```
   Key: OPENAI_API_KEY
   Value: sk-your-actual-key-here
   ```
6. Click **Save Changes**
7. Service will automatically redeploy with OpenAI enabled!

### Option B: Via render.yaml (for new services)

The `render.yaml` already has it configured:
```yaml
- key: OPENAI_API_KEY
  sync: false
```

When creating a new service, just add the value in the Render dashboard.

---

## 🧪 Step 3: Test OpenAI Integration

### A. Wait for Deployment

After adding the API key, Render will redeploy (~2-3 minutes).

Watch the logs for:
```
==> Running 'node src/server.js'
✅ Server is running on port 10000
```

### B. Test via Frontend

1. Go to https://travel-atlas.pages.dev/designer/create
2. Fill out the form:
   - Destination: "Paris, France"
   - Trip length: 5 days
   - Pace: Balanced
   - Budget: Medium
   - Profiles: Cultural Explorer + Food Lover
3. Click "Generate My Itinerary"
4. You should see **AI-generated activities** based on your preferences!

### C. Test Chat

Once in the planner:
1. Type in the AI Assistant: "Add more food experiences"
2. AI will respond with personalized suggestions
3. Much better than mock responses!

---

## 🔍 How It Works

### Itinerary Generation

When you create a trip, the backend:

1. Receives your preferences
2. Creates a detailed prompt for OpenAI
3. Asks GPT-4o-mini to generate a JSON itinerary
4. Returns structured activities, descriptions, costs
5. Frontend displays them in the planner

### AI Chat

When you chat with the assistant:

1. Sends your message + conversation history
2. OpenAI provides contextual responses
3. Can understand complex requests like:
   - "Make it more relaxed"
   - "Replace day 3 with beach activities"
   - "Add a cooking class"

---

## 🛡️ Fallback Behavior

If no OpenAI API key is set:
- ✅ App still works!
- ✅ Uses mock responses
- ⚠️ Less personalized, generic suggestions
- 📝 Logs warning: "OPENAI_API_KEY not set, using mock responses"

This is great for:
- Testing locally without API key
- Development
- Demo purposes

---

## 🔧 Troubleshooting

### "OpenAI API key not found"

**Check:**
1. Render Dashboard → Environment variables
2. Key name is exactly: `OPENAI_API_KEY`
3. Value starts with `sk-`
4. Service was redeployed after adding key

**Fix:**
- Add the key in Render dashboard
- Service auto-redeploys

### "Insufficient quota"

**Means:** You need to add credits to OpenAI

**Fix:**
1. OpenAI Dashboard → Billing
2. Add payment method
3. Purchase credits ($5 minimum)

### "Rate limit exceeded"

**Means:** Too many requests too fast

**Fix:**
- Wait a minute and try again
- OpenAI has rate limits for free tier
- Upgrade to paid tier for higher limits

### Still seeing mock responses

**Check:**
1. Backend logs: `OPENAI_API_KEY not set` warning?
2. If yes: API key not configured properly
3. If no: Check OpenAI API key is valid
4. Test: Visit `https://your-backend.onrender.com/health`

---

## 📊 Monitoring Usage

### OpenAI Dashboard

1. Go to https://platform.openai.com/usage
2. See your usage in real-time
3. Set budget alerts

### Recommended Settings

- **Monthly budget:** $10-20 (plenty for small-medium traffic)
- **Hard limit:** Enable to prevent overages
- **Email alerts:** On at 50% and 90% of budget

---

## 🚀 Local Testing (Optional)

Test OpenAI locally before deploying:

### 1. Add to Local .env

```bash
cd backend
echo "OPENAI_API_KEY=sk-your-key" >> .env
```

### 2. Run Backend Locally

```bash
npm run dev
```

### 3. Test

```bash
curl -X POST http://localhost:3001/api/ai/generate-itinerary \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Tokyo",
    "tripLength": 7,
    "travelPace": "balanced",
    "budget": "medium",
    "travelerProfiles": ["cultural-explorer", "food-lover"]
  }'
```

You should see a real OpenAI-generated itinerary!

---

## ✅ Completion Checklist

- [ ] Get OpenAI API key from platform.openai.com
- [ ] Add payment method (required)
- [ ] Set budget limit ($10-20 recommended)
- [ ] Add `OPENAI_API_KEY` to Render environment variables
- [ ] Wait for Render to redeploy
- [ ] Test itinerary generation via frontend
- [ ] Test AI chat
- [ ] Monitor usage on OpenAI dashboard

---

## 🎉 You're Done!

Your Travel Atlas now has **real AI-powered itinerary generation**!

**What users will get:**
- ✨ Personalized itineraries based on their exact preferences
- 🎯 Activities matched to their traveler profiles
- 💬 Intelligent chat that understands context
- 🌍 Destination-specific recommendations
- 💰 Budget-appropriate suggestions

**Cost:** ~$0.01-0.02 per itinerary generated

---

**Need help?** Check the backend logs in Render dashboard for any errors.
