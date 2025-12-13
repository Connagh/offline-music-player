import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music } from 'lucide-react';
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
    onPrevious
}) {
    const formatTime = (time) => {
        if (!time) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{
            height: 90,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(9, 9, 11, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            px: 3,
            position: 'relative',
            zIndex: 10
        }}>
            {/* Track Info */}
            <Box sx={{ width: '30%', minWidth: 200, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                    width: 56,
                    height: 56,
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
                        <Music size={24} />
                    )}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    {currentTrack && (
                        <>
                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>{currentTrack.title}</Typography>
                            <Typography variant="body2" color="text.secondary" noWrap component="div">
                                <ArtistLinks artist={currentTrack.artist} onFilter={onFilter} />
                            </Typography>
                            {(currentTrack.bitrate || currentTrack.sampleRate) && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, opacity: 0.6 }}>
                                    {currentTrack.bitrate && (
                                        <Typography variant="caption" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0.5, px: 0.5 }}>
                                            {Math.round(currentTrack.bitrate / 1000)}kbps
                                        </Typography>
                                    )}
                                    {currentTrack.sampleRate && (
                                        <Typography variant="caption" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0.5, px: 0.5 }}>
                                            {Math.round(currentTrack.sampleRate / 100) / 10}kHz
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Box>

            {/* Controls */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, maxWidth: 600 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <IconButton size="small" onClick={onPrevious} sx={{ color: 'text.secondary' }}><SkipBack size={20} /></IconButton>
                    <IconButton onClick={onTogglePlay} sx={{ bgcolor: 'text.primary', color: 'background.default', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </IconButton>
                    <IconButton size="small" onClick={onNext} sx={{ color: 'text.secondary' }}><SkipForward size={20} /></IconButton>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', color: 'text.secondary', fontSize: '0.75rem' }}>
                    <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>{formatTime(currentTime)}</Typography>
                    <Slider
                        size="small"
                        value={currentTime}
                        max={duration || 0}
                        onChange={(_, value) => onSeek(value)}
                        sx={{ flex: 1 }}
                    />
                    <Typography variant="caption" sx={{ minWidth: 40 }}>{formatTime(duration)}</Typography>
                </Stack>
            </Box>

            {/* Volume */}
            <Box sx={{ width: '30%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: 'text.secondary' }}>
                <Volume2 size={20} />
                <Slider
                    size="small"
                    value={volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(_, value) => onVolumeChange(value)}
                    sx={{ width: 100 }}
                />
            </Box>
        </Box>
    );
}
