# Local Music Player

A privacy-focused, local-first music player that runs entirely in your browser. This application allows you to scan your local music library, manage playlists, and enjoy your collection without uploading any data to the cloud.

## 🎵 Features

- **Local-First Architecture**: Your music plays directly from your device. No cloud uploads, no tracking.
- **Format Support**: Supports common audio formats including MP3, FLAC, WAV, OGG, and M4A.
- **Smart Metadata**: Automatically extracts and displays cover art, artist names, albums, and technical details (bitrate, sample rate) using `music-metadata-browser`.
- **Persistent Library**: Uses **IndexedDB** to store your library index, so your music is ready to play even after you reload the page.
- **Responsive Design**: Built with **Material UI (MUI)** for a sleek, dark-mode-first interface that works on desktop and mobile.
- **Search & Filter**: Filtering by Artist, Album, or generic search terms.
- **Likes**: 'Like' your favorite tracks to create an instant favorites list.

## � Storage & Privacy

- **Data Persistence**: Your library index is stored in your browser's **IndexedDB**.
- **Audio Files**:
  - **Chrome/Edge (Desktop)**: The app uses the **File System Access API** to create read-only references to your files. This means your files are *not* duplicated into the local browser cache, resulting in minimal storage usage.
  - **Safari/Firefox (and Mobile)**: Due to browser security limitations preventing persistent file access, the app must import file copies into local browser cache via 'IndexedDB' to allow playback after a page refresh. **This increases storage usage significantly (equal to the size of your music library).**
- **Clearing Storage**: You can reset your library and clear all stored data via the **Settings** menu.

## �🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **UI Library**: [Material UI (MUI)](https://mui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Hooks (`useReducer`, `useState`, `useContext`)
- **Persistence**: [idb-keyval](https://github.com/jakearchibald/idb-keyval)
- **Audio Processing**: [music-metadata-browser](https://github.com/borewit/music-metadata-browser)
- **Virtualization**: [react-virtuoso](https://virtuoso.dev/) for efficient rendering of large song lists.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/local-music-player-website.git
   cd local-music-player-website
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   To run with host access (for testing on mobile devices on the same network):
   ```bash
   npm run dev:host
   ```
   Open your browser to the URL shown in the terminal (usually `http://localhost:5173`).

### Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist` folder, ready to be deployed to any static host (GitHub Pages, Vercel, Netlify, etc.).

## Usage

1. **Scan Library**: Click the **Folder Icon** in the top right to select a folder on your device containing your music.
   - On mobile/tablets where folder selection might be limited, it will fallback to a file picker.
2. **Playback**: Click any song to start playing.
   - Use the bottom player bar to pause, skip, seek, or shuffle.
3. **Filtering**:
   - Use the Search Bar to find specific songs.
   - Click functionality chips (like "Likes") to filter your view.
4. **Settings**: Click the **Gear Icon** to:
   - Toggle Theme (Dark/Light).
   - Export/Import your user data (play counts, likes).
   - Reset your library.

## License

This project is open source and available under the AGPL-3.0 license.
