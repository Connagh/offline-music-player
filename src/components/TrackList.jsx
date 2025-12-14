import React, { useMemo } from 'react';
import { Music } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { Box, Typography, Chip } from '@mui/material';
import { ArtistLinks } from './ArtistLinks';
import { WelcomeGuide } from './WelcomeGuide';

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
    return <img src={src} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
});

export function TrackList({ tracks, onPlay, onFilter, currentTrack }) {
    const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'ascending' });

    const sortedTracks = useMemo(() => {
        let sortableTracks = [...tracks];
        if (sortConfig.key !== null) {
            sortableTracks.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableTracks;
    }, [tracks, sortConfig]);

    const formatDuration = (seconds) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const itemContent = (index, track) => {
        const isSelected = currentTrack?.id === track.id;

        return (
            <Box
                onClick={() => onPlay(track)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'action.selected' : 'transparent',
                    '&:hover': {
                        bgcolor: 'action.hover'
                    }
                }}
            >
                {/* Cover Art - 40x40 as per Figma */}
                <Box sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary'
                }}>
                    {track.picture ? (
                        <CoverImage blob={track.picture} />
                    ) : (
                        <Music size={20} />
                    )}
                </Box>

                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 500,
                            lineHeight: 1.5,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {track.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center' }}>
                            <ArtistLinks
                                artist={track.artist}
                                onFilter={onFilter}
                                sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                            />
                        </Typography>

                        {/* Optional Dot Separator if needed */}
                        {/* <Typography variant="caption" color="text.secondary">•</Typography> */}
                    </Box>
                </Box>

                {/* Right Side: Duration or Chip */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                        {formatDuration(track.duration)}
                    </Typography>
                    {/* Quality Badge - Mini */}
                    {(track.bitrate && track.bitrate > 320000) && (
                        <Chip label="HQ" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }} />
                    )}
                </Box>
            </Box>
        );
    };

    const virtuosoRef = React.useRef(null);

    // Scroll to active track when it changes
    React.useEffect(() => {
        if (currentTrack && virtuosoRef.current) {
            const index = sortedTracks.findIndex(t => t.id === currentTrack.id);
            if (index !== -1) {
                virtuosoRef.current.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
            }
        }
    }, [currentTrack, sortedTracks]);

    // Scroll to top only when sort changes
    React.useEffect(() => {
        virtuosoRef.current?.scrollToIndex({ index: 0 });
    }, [sortConfig]);

    return (
        sortedTracks.length === 0 ? (
            <WelcomeGuide />
        ) : (
            <Virtuoso
                ref={virtuosoRef}
                style={{ height: '100%' }}
                data={sortedTracks}
                itemContent={itemContent}
            />
        )
    );
}
