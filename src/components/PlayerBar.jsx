import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Heart, Shuffle } from 'lucide-react';
import { Box, Typography, Slider, IconButton, Stack } from '@mui/material';
import { ArtistLinks } from './ArtistLinks';

const CoverImage = React.memo(({ blob }) => {
    const [src, setSrc] = React.useState(null);
    React.useEffect(() => {
        if (!blob) {
            setSrc(null);
            return;
        }
        const url = URL.createObjectURL(blob);
        setSrc(url);
        return () => URL.revokeObjectURL(url);
    }, [blob]);

    if (!src) return null;
    return <img src={src} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
});

export function PlayerBar({
    isPlaying,
    onTogglePlay,
    currentTrack,
    currentTime,
    duration,
    onSeek,
    volume,
    onVolumeChange,
    onFilter,
    onNext,
    onPrevious,
    isLiked,
    onLikeToggle,
    isShuffle,
    onToggleShuffle
}) {
    const formatTime = (time) => {
        if (!time) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')} `;
    };

    return (
        <Box sx={{
            height: 105, // Compact height
            bgcolor: '#191A23',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 10,
            pb: 1 // Reduced padding bottom
        }}>
            {/* Progress Bar - Top Edge */}
            {/* Using Slider but styled to look like the thin bar in Figma */}
            <Box sx={{ width: '100%', height: 8, position: 'relative', mt: -2 /* Pull up to edge */, pt: '2px', px: 2 }}>
                <Slider
                    size="small"
                    value={currentTime}
                    max={duration || 0}
                    onChange={(_, value) => onSeek(value)}
                    sx={{
                        color: 'primary.main',
                        height: 4,
                        padding: 0,
                        '& .MuiSlider-thumb': {
                            width: 0,
                            height: 0,
                            '&:hover, &.Mui-focusVisible, &.Mui-active': {
                                width: 12,
                                height: 12,
                            },
                            transition: 'width 0.2s, height 0.2s'
                        },
                        '& .MuiSlider-rail': {
                            opacity: 0.2,
                            bgcolor: 'text.primary'
                        }
                    }}
                />
            </Box>

            {/* Song Metadata - Centered roughly */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5, // Reduced gap
                px: 2,
                mt: 2,  // 16px top spacing
                mb: 1   // Reduced bottom spacing
            }}>
                <Box sx={{
                    width: 36, // Reduced size
                    height: 36, // Reduced size
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: 'action.hover',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary'
                }}>
                    {currentTrack?.picture ? (
                        <CoverImage blob={currentTrack.picture} />
                    ) : (
                        <Music size={18} />
                    )}
                </Box>
                <Box sx={{ minWidth: 0, textAlign: 'left' }}>
                    {currentTrack ? (
                        <>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{currentTrack.title}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap component="div" sx={{ fontSize: '0.7rem' }}>
                                <ArtistLinks artist={currentTrack.artist} onFilter={onFilter} />
                            </Typography>
                        </>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>Select a song</Typography>
                    )}
                </Box>
            </Box>

            {/* Controls - Bottom Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, mb: 0.5, width: '100%' }}>

                {/* Left Spacer for Balance - Now with Heart & Shuffle */}
                <Box sx={{ width: 80, display: 'flex', justifyContent: 'flex-start', gap: 0.5 }}>
                    <IconButton
                        onClick={onLikeToggle}
                        color={isLiked ? "primary" : "default"}
                        disabled={!currentTrack}
                        size="small"
                    >
                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                    </IconButton>
                    <IconButton
                        onClick={onToggleShuffle}
                        color={isShuffle ? "primary" : "default"}
                        size="small"
                    >
                        <Shuffle size={18} />
                    </IconButton>
                </Box>

                {/* Center Controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={onPrevious} sx={{ color: 'text.primary' }} size="small">
                        <SkipBack size={20} />
                    </IconButton>
                    <IconButton
                        onClick={onTogglePlay}
                        sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            width: 40, // Reduced size
                            height: 40, // Reduced size
                            '&:hover': { bgcolor: 'primary.dark' }
                        }}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </IconButton>
                    <IconButton onClick={onNext} sx={{ color: 'text.primary' }} size="small">
                        <SkipForward size={20} />
                    </IconButton>
                </Box>

                {/* Right Volume */}
                <Box sx={{ width: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    <Volume2 size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
                    <Slider
                        size="small"
                        value={volume}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(_, v) => onVolumeChange(v)}
                        sx={{
                            width: 50,
                            color: 'text.secondary',
                            '& .MuiSlider-thumb': {
                                width: 10,
                                height: 10,
                            }
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
}
