# PyTutor Focus Mode - Chrome Extension

A Chrome extension that enhances your [pythontutor.com](https://pythontutor.com) experience by adding a focus mode that shows only the visualization pane.

## Features

- 🎯 **Focus Mode**: Hide all page elements except the `#pyOutputPane` visualization
- ⌨️ **Keyboard Shortcut**: Toggle with `Ctrl+Shift+F` (or `Cmd+Shift+F` on Mac)
- 💾 **State Persistence**: Your preference is saved and restored on page reload
- 🎨 **Visual Indicator**: See when focus mode is active with a subtle notification

## Installation

### From Source

1. **Clone or download** this repository
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build the extension**:
   ```bash
   npm run build
   ```
4. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

## Usage

1. Navigate to any page on [pythontutor.com](https://pythontutor.com)
2. Press `Ctrl+Shift+F` (Windows/Linux) or `Cmd+Shift+F` (Mac) to toggle focus mode
3. When active, only the visualization pane will be visible
4. Press the shortcut again to restore the full page

### Extension Popup

Click the extension icon in your Chrome toolbar to:
- See the current focus mode status
- View the keyboard shortcut reminder
- Check if you're on a pythontutor.com page

## Development

### Project Structure

```
pytutor-chrome/
├── src/
│   ├── background/     # Background service worker
│   ├── content/        # Content script (runs on pythontutor.com)
│   │   ├── index.ts    # Main content script logic
│   │   └── styles.css  # Focus mode styles
│   └── popup/          # Extension popup UI
│       ├── index.html
│       ├── main.ts
│       └── style.css
├── public/
│   ├── manifest.json   # Extension manifest (V3)
│   └── icons/          # Extension icons
├── dist/               # Built extension (generated)
└── package.json
```

### Build Commands

- **Development build** (with watch mode):
  ```bash
  npm run dev
  ```
- **Production build**:
  ```bash
  npm run build
  ```

### Tech Stack

- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling
- **Manifest V3** - Latest Chrome extension standard

## How It Works

1. **Content Script** (`src/content/index.ts`):
   - Injects into pythontutor.com pages
   - Listens for toggle messages from the background script
   - Adds/removes a CSS class to enable/disable focus mode
   - Persists state using `chrome.storage`

2. **Background Script** (`src/background/index.ts`):
   - Listens for the keyboard command
   - Sends toggle messages to the active tab's content script

3. **Focus Mode CSS** (`src/content/styles.css`):
   - Hides all direct children of `<body>` except `#pyOutputPane`
   - Displays a visual indicator when active

## License

MIT

## Contributing

Feel free to open issues or submit pull requests!
