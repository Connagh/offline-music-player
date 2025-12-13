import React from 'react';
import { Chip } from '@mui/material';
import { splitArtistString } from '../utils/artistUtils';

export function ArtistLinks({ artist, onFilter }) {
    if (!artist) return null;

    const artists = splitArtistString(artist);

    return (
        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
            {artists.map((name, index) => (
                <React.Fragment key={index}>
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            onFilter('artist', name);
                        }}
                        style={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        className="hover:underline"
                    >
                        {name}
                    </span>
                    {index < artists.length - 1 && <span style={{ color: 'text.secondary', opacity: 0.7 }}>, </span>}
                </React.Fragment>
            ))}
        </span>
    );
};
