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
...
