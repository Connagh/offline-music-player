import React, { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from '@mui/material/styles';
import { splitArtistString } from '../utils/artistUtils';

export function LibraryGraph({ tracks, onPlay, onFilter }) {
    const theme = useTheme();
    const graphRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef();

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight
            });
        }
    }, []);

    const data = useMemo(() => {
        const nodes = new Map();
        const links = [];

        // Helper to add node if not exists
        const addNode = (id, type, group, val, name) => {
            if (!nodes.has(id)) {
                nodes.set(id, { id, type, group, val, name });
            }
            return nodes.get(id);
        };

        tracks.forEach(track => {
            // 1. Create Track Node
            const trackId = `track:${track.id}`;
            // Use track.title as the friendly name
            addNode(trackId, 'track', 3, 1, track.title);

            // 2. Create Album Node
            if (track.album) {
                const albumId = `album:${track.album}`;
                addNode(albumId, 'album', 2, 3, track.album);

                // Link Track -> Album
                links.push({ source: albumId, target: trackId });
            }

            // 3. Create Artist Node(s)
            if (track.artist) {
                const artists = splitArtistString(track.artist);
                artists.forEach(artist => {
                    const artistId = `artist:${artist}`;
                    const artistNode = addNode(artistId, 'artist', 1, 5, artist);

                    // Link Artist -> Album (if album exists)
                    // This creates the Artist -> Album -> Track hierarchy
                    if (track.album) {
                        const albumId = `album:${track.album}`;
                        // Avoid duplicates if we process multiple tracks for same album
                        if (!links.some(l => l.source === artistId && l.target === albumId)) {
                            links.push({ source: artistId, target: albumId });
                        }
                    } else {
                        // Orphan track: Link Artist -> Track directly
                        links.push({ source: artistId, target: trackId });
                    }
                });
            }
        });

        // Convert Map to Array
        return {
            nodes: Array.from(nodes.values()),
            links: links
        };
    }, [tracks]);

    const [currentZoom, setCurrentZoom] = useState(1);

    // Zoom Thresholds
    // 0 - 0.15: No labels
    // 0.15 - 0.50: Artists only
    // 0.50 - 1.50: Artists + Albums
    // > 1.50: Artists + Albums + Songs

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', background: theme.palette.background.default, position: 'relative' }}>
            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={data}
                nodeLabel="name" // Show name on hover
                onZoom={(transform) => {
                    // transform is {x, y, k}
                    // k is scale
                    setCurrentZoom(transform.k);
                }}
                nodeColor={node => {
                    switch (node.type) {
                        case 'artist': return '#1db954'; // Green
                        case 'album': return '#a855f7';  // Purple
                        default: return 'rgba(255, 255, 255, 0.6)'; // White-ish
                    }
                }}
                nodeVal={node => node.val}
                linkColor={() => theme.palette.divider}
                backgroundColor={theme.palette.background.default}
                onNodeClick={(node) => {
                    if (node.type === 'track') {
                        // Find the actual track object
                        const trackId = node.id.replace('track:', '');
                        const track = tracks.find(t => t.id === Number(trackId) || t.id === trackId);
                        if (track) onPlay(track);
                    } else if (node.type === 'album') {
                        onFilter('album', node.id.replace('album:', ''));
                    } else if (node.type === 'artist') {
                        onFilter('artist', node.id.replace('artist:', ''));
                    }
                }}
                nodeCanvasObject={(node, ctx, globalScale) => {
                    // Use the friendly name we stored
                    const label = node.name || node.id;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;

                    // Determine visibility based on Zoom Level
                    let showLabel = false;

                    if (globalScale > 0.15) {
                        // > 15%: Show Artists
                        if (node.type === 'artist') showLabel = true;

                        if (globalScale > 0.50) {
                            // > 50%: Show Albums (and Artists)
                            if (node.type === 'album') showLabel = true;
                        }

                        if (globalScale > 1.5) {
                            // > 150%: Show Songs (and Albums and Artists)
                            if (node.type === 'track') showLabel = true;
                        }
                    }

                    // Set Colors
                    if (node.type === 'artist') ctx.fillStyle = '#1db954';
                    else if (node.type === 'album') ctx.fillStyle = '#a855f7';
                    else ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

                    if (showLabel) {
                        // Draw Label (Text with background)
                        // For tracks, maybe draw Dot + Text?
                        // Previous implementation for Artists was ONLY text (no dot).
                        // Let's keep Artists/Albums as Text-Only when zoomed in, and Tracks as Dot+Text?
                        // Or consistent? Let's try consistent Text-Only for Artists/Albums, and Dot+Text for tracks.

                        if (node.type === 'track') {
                            // Draw Dot
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
                            ctx.fill();

                            // Draw Text Offset
                            ctx.textAlign = 'left';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; // Dimmer text for tracks
                            ctx.fillText(label, node.x + 6, node.y);
                        } else {
                            // Draw Text Box
                            const textWidth = ctx.measureText(label).width;
                            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                            // Background
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                            // Text
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            if (node.type === 'artist') ctx.fillStyle = '#1db954';
                            else ctx.fillStyle = '#a855f7';
                            ctx.fillText(label, node.x, node.y);
                        }
                    } else {
                        // Draw Dot (Hidden Label)
                        ctx.beginPath();
                        // Size: Artist > Album > Track
                        const r = node.type === 'artist' ? 4 : (node.type === 'album' ? 3 : 4);
                        // Note: User asked for Track circle to be size 4 ("twice the size" of 2).
                        // I'll make Artist/Album distinct/similar.
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        ctx.fill();
                    }
                }}
            />
            {/* Zoom Indicator */}
            <div style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                color: 'white',
                background: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 1000,
                fontFamily: 'monospace'
            }}>
                Zoom: {Math.round(currentZoom * 100)}%
            </div>
        </div>
    );
}
