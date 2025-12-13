import React from 'react';
import { Play, Music } from 'lucide-react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Box, Paper, Typography, styled } from '@mui/material';
import { ArtistLinks } from './ArtistLinks';

const GridLayout = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: theme.spacing(3),
    padding: theme.spacing(3),
}));

const ItemContainer = styled(Paper)(({ theme }) => ({
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, background-color 0.2s',
    '&:hover': {
        transform: 'translateY(-4px)',
        backgroundColor: theme.palette.action.hover,
    },
    borderRadius: 12,
    border: '1px solid transparent',
    '&:hover': {
        borderColor: theme.palette.divider
    }
}));

const CoverOverlay = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
    '.MuiPaper-root:hover &': {
        opacity: 1,
    },
}));

// Define components outside to prevent re-renders
const GridComponents = {
    List: React.forwardRef(({ style, children, ...props }, ref) => (
        <GridLayout style={style} ref={ref} {...props}>
            {children}
        </GridLayout>
    )),
    Item: ItemContainer
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
    return <img src={src} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
});

export function TileList({ tracks, onPlay, onFilter, currentTrack }) {
    return (
        <VirtuosoGrid
            style={{ height: '100%' }}
            data={tracks}
            components={GridComponents}
            itemContent={(index, track) => (
                <Box onClick={() => onPlay(track)}>
                    <Box sx={{
                        aspectRatio: '1',
                        width: '100%',
                        position: 'relative',
                        bgcolor: 'background.paper',
                        boxShadow: currentTrack?.id === track.id ? '0 0 0 2px #ec4899' : 'none',
                        borderRadius: 1
                    }}>
                        {track.picture ? (
                            <CoverImage blob={track.picture} />
                        ) : (
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', opacity: 0.5 }}>
                                <Music size={48} />
                            </Box>
                        )}
                        <CoverOverlay>
                            <Play size={48} fill="white" color="white" />
                        </CoverOverlay>
                    </Box>
                    <Box sx={{ width: '100%', mb: 0.5 }}>
                        <Typography variant="body2" color="text.primary" noWrap sx={{ fontWeight: 500 }}>
                            {track.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            <ArtistLinks artist={track.artist} onFilter={onFilter} />
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {track.album}
                        </Typography>
                    </Box>
                </Box>
            )}
        />
    );
}
