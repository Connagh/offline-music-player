# Local Music Player Website

A local-first music player that runs entirely in your browser. This application allows you to add your local music library, manage playlists, and enjoy your collection without uploading any data to the internet.

## Browser Support

This application is **officially supported on Google Chrome**, on both **desktop and mobile (iOS and Android)**.

While the app may function in other browsers (such as Edge, Brave, Firefox, or Safari), these environments are **not officially supported** and may result in **unexpected behaviour, reduced functionality, or increased local storage usage** due to browser limitations.

## Features

- **Local-First Architecture**: Your music plays directly from your device.
- **Format Support**: Supports common audio formats including MP3, WAV, OGG, FLAC and M4A.
- **Smart Metadata**: Displays cover art, artist names, albums, and technical details (bitrate, sample rate).
- **Responsive Design**: Built with **Material UI (MUI)**.

## Storage & Privacy

- **Data Persistence**: Your library index is stored in your browser's local cache via **IndexedDB**.
- **Audio Files**:
  - **Google Chrome (Desktop & Mobile)**:  
    Uses the **File System Access API** to create read-only references to your music files. Your audio files are **not duplicated** into browser storage, resulting in minimal disk usage.
  - **Other Browsers**:  
    Due to differences in browser security models and API support, persistent file access may not be available. In these cases, the app may fall back to importing file copies into **IndexedDB** for playback.  
    **This can result in storage usage equal to the size of your music library and may cause unexpected behaviour.**
- **Clearing Storage**: You can reset your library and clear all stored data via the **Settings** menu.

## Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **UI Library**: [Material UI (MUI)](https://mui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Hooks (`useReducer`, `useState`, `useContext`)
- **Persistence**: [idb-keyval](https://github.com/jakearchibald/idb-keyval)
- **Audio Processing**: [music-metadata-browser](https://github.com/borewit/music-metadata-browser)
- **Virtualizstion**: [react-virtuoso](https://virtuoso.dev/) for efficient rendering of large song lists.

## Getting Started

You can use the music player **immediately without installing anything** by visiting the hosted GitHub Pages version:

**https://connagh.github.io/local-music-player-website/**

> **Note:** The application is officially supported only on **Google Chrome (desktop and mobile)**. Using other browsers may result in unexpected behaviour.

### Using the Hosted Version

1. Open the GitHub Pages link above in **Google Chrome**.
2. Click the **Folder Icon** in the top right to select a folder containing your music.
3. Start playing your library instantly — no uploads, no accounts, no setup.

### Local Development (Optional)

If you want to run or modify the project locally:

#### Prerequisites

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

To create an optimised production build:

```bash
npm run build
```

The output will be in the `dist` folder, ready to be deployed to any static host (GitHub Pages, Vercel, Netlify, etc.).

## Usage

1. **Scan Library**: Click the **Folder Icon** in the top right to select a folder on your device containing your music.
   - On mobile/tablets where folder selection might be limited, it will fallback to a file picker.
2. **Playback**: Click any song to start playing.
   - Use the bottom player bar to pause, skip, seek, or shuffle.
   - Use OS native player controls to control your music.
3. **Filtering**:
   - Use the Search Bar to find specific songs.
4. **Settings**: Click the **Gear Icon** to:
   - Export/Import your user data (play counts, likes).
   - Reset your library.

## License

This project is open source and available under the AGPL-3.0 license.
