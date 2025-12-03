# Find My Fit Coach - Project Structure

## 📁 Folder Organization

```
Find-My-Fit-Coach/
├── index.html              # Main HTML page
│
├── src/                    # Source code
│   ├── js/                 # JavaScript files
│   │   └── main.js        # Main application logic
│   │
│   ├── ai/                 # AI services
│   │   └── ai-service.js  # OpenAI GPT integration
│   │
│   └── styles/            # Custom styles (if needed)
│
├── config/                 # Configuration files
│   ├── config.js          # Firebase & OpenAI API keys (gitignored)
│   └── sample-data.js     # Sample/seed data
│
├── docs/                   # Documentation
│   ├── README.md          # Main documentation
│   ├── SETUP.md           # Setup instructions
│   ├── ARCHITECTURE.md    # System architecture
│   └── AI-FEATURES.md     # AI features documentation
│
├── firebase.json          # Firebase hosting config
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── .firebaserc            # Firebase project config
└── .gitignore            # Git ignore rules
```

## 🎯 Key Files

### Frontend
- **index.html** - Main UI with Tailwind CSS
- **src/js/main.js** - Application logic, Firebase integration, UI handlers

### AI Integration
- **src/ai/ai-service.js** - OpenAI GPT-4o-mini integration
  - Personalized workout generation
  - AI coach matching with compatibility scores

### Configuration
- **config/config.js** - API keys and Firebase config (not tracked)
- **firestore.rules** - Database security rules
- **firestore.indexes.json** - Composite indexes for queries

### Documentation
- **docs/README.md** - Project overview and features
- **docs/SETUP.md** - Setup and deployment guide
- **docs/ARCHITECTURE.md** - Technical architecture
- **docs/AI-FEATURES.md** - AI capabilities documentation

## 🔐 Security Notes

The following files contain sensitive data and are gitignored:
- `config/config.js` - API keys (Firebase, OpenAI)
- `firebase-debug.log` - Debug logs

## 🚀 Quick Start

1. Copy `config/config.js.example` to `config/config.js`
2. Add your API keys to `config/config.js`
3. Open `index.html` in a browser
4. Deploy to Firebase Hosting (optional)
