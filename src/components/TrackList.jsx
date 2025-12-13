import React, { useMemo } from 'react';
import { Clock, Music, FileAudio } from 'lucide-react';
import { TableVirtuoso } from 'react-virtuoso';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Chip } from '@mui/material';
import { ArtistLinks } from './ArtistLinks';

// Define components OUTSIDE to prevent re-mounting on every render
const VirtuosoComponents = {
    Scroller: React.forwardRef((props, ref) => (
        <TableContainer component={Box} {...props} ref={ref} />
    )),
    Table: (props) => (
        <Table {...props} sx={{ borderCollapse: 'separate' }} />
    ),
    TableHead: TableHead,
    TableRow: ({ item, context, ...props }) => (
        <TableRow
            {...props}
            hover
            onClick={(e) => {
                // Determine if we should play. 
                // Context contains onPlay.
                // If the click was on a filter element, propagation stopped there.
                context.onPlay(item);
            }}
            selected={context.currentTrack?.id === item.id}
            sx={{
                cursor: 'pointer',
                '&:last-child td, &:last-child th': { border: 0 },
                '&.Mui-selected': { bgcolor: 'rgba(168, 85, 247, 0.08)' },
                '&.Mui-selected:hover': { bgcolor: 'rgba(168, 85, 247, 0.12)' }
            }}
        />
    ),
    TableBody: React.forwardRef((props, ref) => (
        <TableBody {...props} ref={ref} />
    )),
};

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
    return <img src={src} alt="Cover" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', display: 'block' }} />;
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

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatQuality = (bitrate, sampleRate) => {
        const kbps = bitrate ? Math.round(bitrate / 1000) : null;
        const khz = sampleRate ? Math.round(sampleRate / 100) / 10 : null; // Round to 1 decimal

        if (!kbps && !khz) return '';
        return (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', opacity: 0.7 }}>
                {kbps && <span>{kbps}k</span>}
                {khz && <span style={{ fontSize: '0.75em', border: '1px solid', padding: '0 2px', borderRadius: 2 }}>{khz}</span>}
            </Box>
        );
    };

    // Memoize header content
    const fixedHeaderContent = () => (
        <TableRow>
            <TableCell sx={{ width: 50, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>#</TableCell>
            <TableCell sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>Title</TableCell>
            <TableCell sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>Artist</TableCell>
            <TableCell sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>Album</TableCell>
            <TableCell sx={{ width: 80, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>Quality</TableCell>
            <TableCell sx={{ width: 80, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>Time</TableCell>
            <TableCell sx={{ width: 80, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', textAlign: 'right' }}>Plays</TableCell>
        </TableRow>
    );

    // Memoize row content
    // Note: onClick is now handled by the TableRow component via context
    const rowContent = (_index, track) => (
        <>
            <TableCell sx={{ p: 1 }}>
                {track.picture ? (
                    <CoverImage blob={track.picture} />
                ) : (
                    <Box sx={{ width: 32, height: 32, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                        <Music size={16} />
                    </Box>
                )}
            </TableCell>
            <TableCell sx={{ color: 'text.primary', fontWeight: 500, maxWidth: 200 }}>
                <Box sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</Box>
            </TableCell>
            <TableCell sx={{ color: 'text.secondary', maxWidth: 150 }}>
                <ArtistLinks
                    artist={track.artist}
                    onFilter={onFilter}
                    sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                    }}
                />
            </TableCell>
            <TableCell sx={{ color: 'text.secondary', maxWidth: 150 }}>
                <Box
                    component="span"
                    onClick={(e) => { e.stopPropagation(); onFilter('album', track.album); }}
                    sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline', color: 'text.primary' }
                    }}
                >
                    {track.album}
                </Box>
            </TableCell>
            <TableCell sx={{ textAlign: 'right', color: 'text.secondary', fontSize: '0.85rem' }}>
                {formatQuality(track.bitrate, track.sampleRate)}
            </TableCell>
            <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.secondary' }}>{formatDuration(track.duration)}</TableCell>
            <TableCell sx={{ color: 'text.secondary', textAlign: 'right' }}>
                {(track.playCount || 0)}
            </TableCell>
        </>
    );

    return (
        <TableVirtuoso
            data={sortedTracks}
            components={VirtuosoComponents}
            fixedHeaderContent={fixedHeaderContent}
            itemContent={rowContent}
            context={{ onPlay, currentTrack }}
        />
    );
}
