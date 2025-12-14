import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Layout } from './components/Layout';
import { TrackList } from './components/TrackList';

import { PlayerBar } from './components/PlayerBar';
import { SettingsDialog } from './components/SettingsDialog';
import { splitArtistString } from './utils/artistUtils';
import { useLibrary } from './hooks/useLibrary';
import { useAudio } from './hooks/useAudio';
import { AlbumGrid } from './components/AlbumGrid';
import { ArtistGrid } from './components/ArtistGrid';

import { FolderPlus, Settings } from 'lucide-react';
import { Box, Typography, Button, IconButton, ToggleButton, ToggleButtonGroup, LinearProgress, Chip, TextField, InputAdornment, Autocomplete } from '@mui/material';

function App() {
  const { tracks, isScanning, progress, addFolder, addFilesFromInput, resetLibrary, incrementPlayCount, exportUserData, importUserData } = useLibrary();
  // Pass callback to increment play count only when track actually finishes
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    currentTrack,
    playTrack,
    playNext,
    playPrevious,
    togglePlay,
    seek,
    changeVolume
  } = useAudio((finishedTrack) => {
    // Callback from useAudio when a track ends naturally
    if (finishedTrack) {
      incrementPlayCount(finishedTrack.id);
    }
  });

  const [libraryView, setLibraryView] = useState('songs'); // 'songs' | 'albums' | 'artists'
  const [filters, setFilters] = useState([]); // Array of { id, type, value }
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Generate autocomplete options from tracks
  const searchOptions = useMemo(() => {
    const options = [];
    const seen = new Set();
    tracks.forEach(t => {
      if (t.artist) {
        const artists = splitArtistString(t.artist);
        artists.forEach(artistName => {
          if (!seen.has(`artist:${artistName}`)) {
            options.push({ label: artistName, type: 'Artist' });
            seen.add(`artist:${artistName}`);
          }
        });
      }
      if (!seen.has(`album:${t.album}`)) {
        options.push({ label: t.album, type: 'Album' });
        seen.add(`album:${t.album}`);
      }
    });
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [tracks]);

  const calculateAutocompleteValue = useMemo(() => {
    return filters.map(f => ({
      type: f.type,
      label: f.value,
      id: f.id
    }));
  }, [filters]);

  const handleAutocompleteChange = (event, newValue) => {
    if (!newValue) {
      setFilters([]); // Clear on empty
      return;
    }

    // Check if it's a string (FreeSolo) or option object
    // In multiple mode, newValue is an array. We usually want the LAST item added if we are enforcing single mode,
    // or we just take the list. 

    // Enforcing SINGLE filter mode for simplicity as per previous refactor:
    // If multiple were selected, we just take the last one.
    // If it's a simple search, we clear specific filters and set a generic search?
    // Actually, let's look at what we get.

    // If freeSolo text is entered, newValue is string (if not multiple) or array of strings/objects.

    // Let's assume we want to support One Filter OR One Search Term.
    const item = Array.isArray(newValue) ? newValue[newValue.length - 1] : newValue;

    if (!item) {
      setFilters([]);
      return;
    }

    if (typeof item === 'string') {
      // Generic search
      setFilters([{ id: Date.now(), type: 'search', value: item }]);
    } else if (item && item.type) {
      // Structured filter
      setFilters([{ id: Date.now(), type: item.type.toLowerCase(), value: item.label }]);
    }
  };

  // Filter Logic - Unified
  const filteredTracks = useMemo(() => {
    if (filters.length === 0) return tracks;

    return tracks.filter(track => {
      // AND logic: Track must match ALL filters
      return filters.every(filter => {
        if (filter.type === 'search') {
          const term = filter.value.toLowerCase();
          return track.title.toLowerCase().includes(term) ||
            track.artist.toLowerCase().includes(term) ||
            track.album.toLowerCase().includes(term);
        }
        if (filter.type === 'artist') {
          // Exact match or partial? Let's do partial for multi-artist support flexibility, 
          // but strict enough to be useful.
          return track.artist.toLowerCase().includes(filter.value.toLowerCase());
        }
        if (filter.type === 'album') {
          return track.album.toLowerCase() === filter.value.toLowerCase();
        }
        return true;
      });
    });
  }, [tracks, filters]);

  // Derived Data: Albums (basing on filteredTracks)
  const albums = useMemo(() => {
    const albumMap = new Map();
    filteredTracks.forEach(track => {
      const key = track.album;
      // Unknown Album handling?
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          name: track.album,
          artist: track.artist, // Representative artist
          picture: track.picture, // First picture found
          count: 0
        });
      }
      const album = albumMap.get(key);
      album.count++;
      if (!album.picture && track.picture) album.picture = track.picture; // Upgrade picture if missing
    });
    return Array.from(albumMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTracks]);

  // Derived Data: Artists (basing on filteredTracks)
  const artists = useMemo(() => {
    const artistMap = new Map();
    filteredTracks.forEach(track => {
      // Split artists using utility to handle exceptions
      const names = splitArtistString(track.artist);
      names.forEach(name => {
        // SMART FILTER: 
        // If we have filters, we only want to include this specific artist IF:
        // 1. It matches the filter directly (Artist match or Search term match)
        // 2. OR the filter matched the Track Title or Album (Context match)
        // This prevents "Featured" artists from showing up when searching for the Main artist.

        if (filters.length > 0) {
          const isRelevant = filters.every(filter => {
            const fVal = filter.value.toLowerCase();
            if (filter.type === 'search') {
              // Relevant if Name matches.
              // We Do NOT match Title/Album here to avoid "Featured" artists cluttering the view.
              // If user searches "Kanye", they want Kanye, not everyone who has a song with him.
              return name.toLowerCase().includes(fVal);
            }
            if (filter.type === 'artist') {
              // Must match artist name
              return name.toLowerCase().includes(fVal);
            }
            if (filter.type === 'album') {
              // If filtering by album, all artists on it are relevant
              return true;
            }
            return true;
          });

          if (!isRelevant) return;
        }

        if (!artistMap.has(name)) {
          artistMap.set(name, {
            name: name,
            picture: track.picture,
            count: 0
          });
        }
        const artist = artistMap.get(name);
        artist.count++;
        // Try to find a good picture. 
        // Optimization: Maybe prioritize pictures where this artist is primary?
        // For now simpler: Just take first non-null
        if (!artist.picture && track.picture) artist.picture = track.picture;
      });
    });
    return Array.from(artistMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTracks, filters]);


  const handleFilter = useCallback((type, value) => {
    // Single filter mode: Replace existing filters
    setFilters([{ id: Date.now() + Math.random(), type, value }]);
  }, []);

  /* Fixed: Use handleFilter instead of handleFilterChange */
  const handleAlbumSelect = useCallback((album) => {
    handleFilter('album', album);
    setLibraryView('songs');
  }, [handleFilter]);

  const handleArtistSelect = useCallback((artist) => {
    handleFilter('artist', artist);
    setLibraryView('songs');
  }, [handleFilter]);

  const handleReset = async () => {
    await resetLibrary();
    setSettingsOpen(false);
  };

  const handleFolderSelect = () => {
    if ('showDirectoryPicker' in window) {
      addFolder();
    } else {
      fileInputRef.current.click();
    }
  };

  const handleFallbackInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesFromInput(e.target.files);
    }
  };

  // Wrap playTrack to include the current filtered list as context
  const handlePlay = (track) => {
    playTrack(track, filteredTracks);
  };

  return (
    <Layout
      playerBar={
        <PlayerBar
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          currentTrack={currentTrack}
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          volume={volume}
          onVolumeChange={changeVolume}
          onFilter={handleFilter}
          onNext={() => playNext()}
          onPrevious={() => playPrevious()}
        />
      }
    >
      <Box sx={{
        p: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'rgba(9, 9, 11, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, mr: 4 }}>
          <Typography variant="h1" sx={{ mr: 2 }}>Music Library</Typography>

          <Autocomplete
            multiple
            freeSolo
            id="library-search"
            options={searchOptions}
            getOptionLabel={(option) => {
              // Handle string (freeSolo) or object
              if (typeof option === 'string') return option;
              return option.label;
            }}
            value={calculateAutocompleteValue}
            onChange={handleAutocompleteChange}
            isOptionEqualToValue={(option, value) => option.type === value.type && option.label === value.label}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    variant="filled"
                    label={`${option.type === 'search' ? 'Search' : option.type === 'artist' ? 'Artist' : 'Album'}: ${option.label}`}
                    size="small"
                    color="primary"
                    {...tagProps}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={filters.length > 0 ? "" : "Search library..."}
                size="small"
              />
            )}
            sx={{
              flex: 1,
              maxWidth: 600,
              '& .MuiOutlinedInput-root': {
                py: 0.5,
                pr: 1
              }
            }}
          />

          <ToggleButtonGroup
            value={libraryView}
            exclusive
            onChange={(e, nextView) => { if (nextView) setLibraryView(nextView); }}
            size="small"
            sx={{ bgcolor: 'background.paper' }}
          >
            <ToggleButton value="songs">Songs</ToggleButton>
            <ToggleButton value="albums">Albums</ToggleButton>
            <ToggleButton value="artists">Artists</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton onClick={() => setSettingsOpen(true)}>
            <Settings size={20} />
          </IconButton>


          <Button
            variant="outlined"
            startIcon={<FolderPlus size={20} />}
            onClick={handleFolderSelect}
            sx={{ bgcolor: 'background.paper', color: 'text.primary', borderColor: 'divider' }}
          >
            Add Folder
          </Button>
          {/* Fallback Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFallbackInput}
            webkitdirectory=""
            directory=""
            multiple
            style={{ display: 'none' }}
          />
        </Box>
      </Box>

      {isScanning && (
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Scanning library...</Typography>
            <Typography variant="caption" color="text.secondary">
              Processed {progress.current} of {progress.total} files
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} />
        </Box>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {libraryView === 'albums' ? (
          <Box sx={{ height: '100%', overflow: 'hidden' }}>
            <AlbumGrid
              albums={albums}
              onSelect={handleAlbumSelect}
            />
          </Box>
        ) : libraryView === 'artists' ? (
          <Box sx={{ height: '100%', overflow: 'hidden' }}>
            <ArtistGrid
              artists={artists}
              onSelect={handleArtistSelect}
            />
          </Box>
        ) : (
          <TrackList tracks={filteredTracks} onPlay={handlePlay} onFilterChange={handleFilter} currentTrack={currentTrack} isPlaying={isPlaying} />
        )}
      </Box>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onReset={resetLibrary}
        onExport={exportUserData}
        onImport={importUserData}
      />
    </Layout>
  );
}

export default App;
