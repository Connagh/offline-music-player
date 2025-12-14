import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import { TrackList } from './components/TrackList';

import { PlayerBar } from './components/PlayerBar';
import { SettingsDialog } from './components/SettingsDialog';
import { splitArtistString } from './utils/artistUtils';
import { useLibrary } from './hooks/useLibrary';
import { useAudio } from './hooks/useAudio';


import { FolderPlus, Settings } from 'lucide-react';
import { Box, Typography, Button, IconButton, ToggleButton, ToggleButtonGroup, LinearProgress, Chip, TextField, InputAdornment, Autocomplete } from '@mui/material';

function App() {
  const { tracks, isScanning, progress, addFolder, addFilesFromInput, resetLibrary, incrementPlayCount, exportUserData, importUserData } = useLibrary();
  // Pass callback to increment play count only when track actually finishes
  const {
    audioRef,
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

  const handleFilter = useCallback((type, value) => {
    // Single filter mode: Replace existing filters
    setFilters([{ id: Date.now() + Math.random(), type, value }]);
  }, []);

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

  // Mobile-first structure:
  // Header (Sticky) -> TrackList (Scrollable) -> PlayerBar (Sticky Bottom)
  return (
    <>
      <Box sx={{
        bgcolor: 'rgba(9, 9, 11, 0.95)',
        backdropFilter: 'blur(12px)',
        position: 'fixed', // Anchored to viewport
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'center' // Center the inner content
      }}>
        <Box sx={{
          width: '100%',
          maxWidth: 412, // Maintain mobile width for internal content
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {/* Top Row: Title + Settings */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Music</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={() => setSettingsOpen(true)}>
                <Settings size={20} />
              </IconButton>
              <IconButton size="small" onClick={handleFolderSelect}>
                <FolderPlus size={20} />
              </IconButton>
            </Box>
          </Box>

          {/* Search Bar */}
          <Autocomplete
            multiple
            freeSolo
            id="library-search"
            options={searchOptions}
            getOptionLabel={(option) => {
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
                    label={`${option.label}`}
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
                placeholder={filters.length > 0 ? "" : "Search songs, artists..."}
                size="small"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'background.paper'
                  }
                }}
              />
            )}
          />

          {/* Hidden File Input */}
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

      {/* Main Content Area - Scrollable with Padding for Fixed Bars */}
      {/* Header is roughly 120px tall, Footer is 140px tall. Adding padding to body content */}
      <Box sx={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        pt: '130px', // Space for fixed header
        pb: '140px', // Space for fixed footer
      }}>
        {isScanning && (
          <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Scanning...</Typography>
              <Typography variant="caption" color="text.secondary">
                {progress.current} / {progress.total}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} sx={{ height: 2, borderRadius: 1 }} />
          </Box>
        )}
        <TrackList tracks={filteredTracks} onPlay={handlePlay} onFilterChange={handleFilter} currentTrack={currentTrack} isPlaying={isPlaying} />
      </Box>

      {/* Player Bar - Anchored Fixed Bottom */}
      <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        justifyContent: 'center',
        bgcolor: '#191A23', // Background needs to be on container to cover full width
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        <Box sx={{ width: '100%', maxWidth: 412 }}>
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
        </Box>
      </Box>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onReset={resetLibrary}
        onExport={exportUserData}
        onImport={importUserData}
      />
    </>
  );
}

export default App;
