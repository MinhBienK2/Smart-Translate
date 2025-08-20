# Smart Translate - Browser Extension

A powerful and modern browser extension for instant translation, similar to Google Translate but with enhanced features and a beautiful user interface.

## 🌟 Features

### Core Translation Features

- **Instant Text Translation**: Translate any text instantly with support for 14+ languages
- **Auto Language Detection**: Automatically detect the source language
- **Multiple Language Support**: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Vietnamese
- **Language Swapping**: Quick swap between source and target languages

### Web Page Integration

- **Text Selection Translation**: Select any text on web pages and translate instantly
- **Floating Translation Button**: Appears when text is selected for quick access (configurable)
- **Page Translation**: Translate entire web pages (coming soon)
- **Context Menu Integration**: Right-click to translate selected text

### User Experience

- **Modern UI Design**: Beautiful gradient design with smooth animations
- **Responsive Layout**: Works perfectly on all screen sizes
- **Auto-Fill Selection**: Selected text automatically fills when opening the extension
- **Auto-Pronunciation**: Automatically pronounces words when popup opens (configurable)
- **Auto-Translation**: Automatically translates text when popup opens (configurable)
- **Word Display**: Prominent word display with phonetic transcription
- **UK/US Pronunciation**: Direct buttons for British 🇬🇧 and American 🇺🇸 English
- **Phonetic Transcription**: US and UK pronunciation guides with phonetic symbols
- **Enhanced Details**: Parts of speech, multiple meanings, related words, and examples
- **Translation History**: Keep track of your translations
- **Copy to Clipboard**: One-click copy of translated text
- **Keyboard Shortcuts**: Enter key to translate and pronounce

### Advanced Features

- **Settings Persistence**: Your language preferences are saved
- **Background Processing**: Efficient background service worker
- **Cross-tab Communication**: Seamless integration across browser tabs
- **Welcome Page**: Beautiful onboarding experience

## 🚀 Installation

### For Development/Testing

1. **Clone or Download** this repository
2. **Open Chrome/Edge** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top right)
4. **Click "Load unpacked"** and select the extension folder
5. **Pin the extension** to your toolbar for easy access

### For Production

1. **Create Icons**: Replace the placeholder icon files in the `icons/` folder with actual PNG images:

   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

2. **Package Extension**:
   - Zip all files (excluding README.md and development files)
   - Upload to Chrome Web Store or distribute directly

## 📱 Usage

### Basic Translation

1. **Click the extension icon** in your browser toolbar
2. **Select source language** (or leave as "Auto Detect")
3. **Select target language**
4. **Type or paste text** in the input area
5. **Click "Translate"** or press Ctrl+Enter

### Text Selection Translation

1. **Select any text** on a web page
2. **Click the floating translation button** that appears, or **open the extension popup**
3. **Text auto-fills** the input area automatically
4. **View translation** in the popup
5. **Click 🔊 button** to hear pronunciation

### Context Menu Translation

1. **Right-click on selected text**
2. **Choose "Translate with Smart Translate"**
3. **View translation** in the popup

### Language Switching

- **Swap languages** using the ⇄ button
- **Change default languages** in settings
- **Auto-save** your preferences

### Pronunciation Help

- **Word Display**: See the word prominently displayed with phonetic transcription
- **US Pronunciation**: Click 🇺🇸 🔊 button to hear US English pronunciation
- **UK Pronunciation**: Click 🇬🇧 🔊 button to hear UK English pronunciation
- **Phonetic Guide**: View US [heˈloʊ] and UK [heˈlɔʊ] transcription
- **Direct Access**: No need to select accent - just click the button for your preferred pronunciation
- **Language-specific**: Uses appropriate voice for each language
- **Clear pronunciation**: Optimized speed and pitch for clarity
- **Visual feedback**: Shows which language and accent is being spoken

### Enhanced Translation Details

- **Parts of Speech**: Shows grammatical categories (noun, verb, adjective, etc.)
- **Multiple Meanings**: Displays different interpretations of the word/phrase
- **Related Words**: Shows connected vocabulary and word forms
- **Example Sentences**: Provides usage examples for better understanding
- **Rich Context**: Comprehensive information beyond basic translation

### API Integration for Phonetic Data

The extension uses multiple APIs to provide accurate phonetic transcriptions:

#### **Free APIs (No Key Required):**

- **Free Dictionary API**: Provides basic phonetic data for English words
- **Automatic Fallback**: Works without any configuration

#### **Enhanced APIs (Optional Keys):**

- **WordsAPI**: More comprehensive phonetic data and word information
  - Get free key at [RapidAPI](https://rapidapi.com/dpventures/api/wordsapi)
  - Better coverage and accuracy
- **Forvo API**: Real pronunciation recordings and phonetic data
  - Get free key at [Forvo](https://forvo.com/developers/)
  - Authentic accent-specific pronunciations

#### **How to Add API Keys:**

1. Click the **Settings** button in the extension
2. Enter your API keys (optional)
3. Keys are securely stored in your browser
4. Extension automatically uses available APIs
5. Falls back to free API if premium APIs fail

#### **Auto-Pronunciation Setting:**

- **Toggle On/Off**: Check/uncheck "Auto-pronounce words when popup opens"
- **Default**: Enabled by default for immediate pronunciation
- **Behavior**: When enabled, words are automatically pronounced in US accent when popup opens
- **Customization**: Can be disabled if you prefer manual pronunciation control

#### **Auto-Translation Setting:**

- **Toggle On/Off**: Check/uncheck "Auto-translate text when popup opens"
- **Default**: Enabled by default for immediate translation
- **Behavior**: When enabled, text is automatically translated when popup opens with text
- **Customization**: Can be disabled if you prefer manual translation control

#### **Selection Icon Setting:**

- **Toggle On/Off**: Check/uncheck "Show selection icon when text is selected"
- **Default**: Enabled by default for immediate access
- **Behavior**: When enabled, a floating 🌐 icon appears when you select text on web pages
- **Customization**: Can be disabled if you prefer not to see the floating icon
- **Real-time**: Setting takes effect immediately without page refresh

## 🛠️ Technical Details

### Architecture

- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background processing and state management
- **Content Scripts**: Web page integration and text selection
- **Popup Interface**: User-friendly translation interface

### APIs Used

- **MyMemory Translation API**: Free translation service
- **Chrome Extension APIs**: Browser integration
- **Local Storage**: Settings and history persistence

### Browser Support

- **Chrome 88+**: Full support
- **Edge 88+**: Full support (Chromium-based)
- **Other Chromium browsers**: Compatible

## 🔧 Configuration

### Language Settings

```javascript
// Default languages can be modified in background.js
this.settings = {
  defaultFromLang: 'auto',
  defaultToLang: 'en',
  // ... other settings
};
```

### API Configuration

```javascript
// Translation API endpoints in popup.js
const response = await fetch(
  `https://api.mymemory.translated.net/get?q=${text}&langpair=${fromLang}|${toLang}`
);
```

### Permissions

```json
// Required permissions in manifest.json
"permissions": [
    "activeTab",
    "storage",
    "scripting",
    "tabs"
]
```

## 🎨 Customization

### Styling

- **CSS Variables**: Easy color scheme modification
- **Responsive Design**: Mobile-first approach
- **Animation Support**: Smooth transitions and effects

### Features

- **Modular Code**: Easy to add/remove features
- **Event System**: Extensible event handling
- **Plugin Architecture**: Support for additional translation services

## 📋 Development

### Project Structure

```
extension-translate/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── content.js            # Content script for web pages
├── content.css           # Content script styling
├── background.js         # Background service worker
├── welcome.html          # Welcome/onboarding page
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Building

1. **Modify code** as needed
2. **Test in browser** using developer mode
3. **Package for distribution** when ready

### Testing

- **Load unpacked** in Chrome extensions
- **Test on various websites**
- **Check console for errors**
- **Verify all features work**

## 🚧 Future Enhancements

### Planned Features

- **Full Page Translation**: Complete webpage translation
- **Offline Support**: Basic offline translation
- **Voice Translation**: Speech-to-text and text-to-speech
- **Translation Memory**: Learn from user corrections
- **API Key Support**: Google Translate API integration
- **Dark Mode**: Theme switching
- **Export History**: Save translations to file

### API Improvements

- **Multiple Services**: Fallback translation providers
- **Rate Limiting**: Better API usage management
- **Caching**: Improved performance and offline support

## 🤝 Contributing

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Development Guidelines

- **Follow existing code style**
- **Add comments for complex logic**
- **Test on multiple browsers**
- **Update documentation**

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **MyMemory Translation API** for free translation services
- **Chrome Extension APIs** for browser integration
- **Modern CSS** for beautiful styling
- **Open Source Community** for inspiration and tools

## 📞 Support

### Issues and Questions

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check this README first
- **Code Comments**: Inline documentation in source files

### Getting Help

1. **Check existing issues** for similar problems
2. **Review the code** for implementation details
3. **Test in different browsers** to isolate issues
4. **Provide detailed information** when reporting problems

---

**Smart Translate** - Making the web accessible in every language! 🌐✨
