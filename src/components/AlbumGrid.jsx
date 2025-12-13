import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Music, Disc } from 'lucide-react';
import { VirtuosoGrid } from 'react-virtuoso';
import styled from '@emotion/styled';

const ItemContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[4],
        backgroundColor: theme.palette.action.hover,
    },
}));

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

export const AlbumGrid = React.memo(function AlbumGrid({ albums, onSelect }) {
    return (
        <VirtuosoGrid
            style={{ height: '100%', width: '100%' }}
            totalCount={albums.length}
            components={{
                List: React.forwardRef(({ style, children, ...props }, ref) => (
                    <div
                        ref={ref}
                        {...props}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '16px',
                            padding: '16px',
                            ...style,
                        }}
                    >
                        {children}
                    </div>
                )),
                Item: ({ children, ...props }) => (
                    <div {...props} style={{ padding: 0 }}>{children}</div>
                )
            }}
            itemContent={(index) => {
                const album = albums[index];
                return (
                    <ItemContainer elevation={1} onClick={() => onSelect(album.name)}>
                        <Box sx={{
                            width: '100%',
                            aspectRatio: '1/1',
                            mb: 2,
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: 'action.selected',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {album.picture ? (
                                <CoverImage blob={album.picture} />
                            ) : (
                                <Disc size={48} opacity={0.5} />
                            )}
                        </Box>
                        <Box sx={{ width: '100%', textAlign: 'left' }}>
                            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {album.name}
                            </Typography>
                            <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                                {album.artist}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7 }}>
                                {album.count} {album.count === 1 ? 'song' : 'songs'}
                            </Typography>
                        </Box>
                    </ItemContainer>
                );
            }}
        />
    );
});
