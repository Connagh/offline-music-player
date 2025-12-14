import React from 'react';
import { Box } from '@mui/material';
import { splitArtistString } from '../utils/artistUtils';

export function ArtistLinks({ artist, onFilter }) {
    if (!artist) return null;

    const artists = splitArtistString(artist);

    return (
        <Box component="span" sx={{ display: 'inline-flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
            {artists.map((name, index) => (
                <React.Fragment key={index}>
                    <Box
                        component="span"
                        onClick={(e) => {
                            e.stopPropagation();
                            onFilter('artist', name);
                        }}
                        sx={{
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                        }}
                    >
                        {name}
                    </Box>
                    {index < artists.length - 1 && <Box component="span" sx={{ color: 'text.secondary', opacity: 0.7 }}>, </Box>}
                </React.Fragment>
            ))}
        </Box>
    );
};
