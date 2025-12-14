import React from 'react';
import { Box, Typography, Paper, Divider, Link } from '@mui/material';
import { FolderPlus, Github } from 'lucide-react';

export function WelcomeGuide() {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%', // Use full available height
            p: 2,
            color: 'text.secondary',
            overflow: 'auto' // Allow safe scrolling if really needed
        }}>
            <Paper elevation={0} sx={{
                p: 3,
                maxWidth: 500, // Slightly tighter max width
                width: '100%', // Take full width up to max
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start', // Align children to start
                textAlign: 'left', // Text left alignment
                gap: 2.5
            }}>

                {/* Header */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Welcome to Offline's Music Player
                    </Typography>
                    <Typography variant="body1">
                        Your private, local music player.
                    </Typography>
                </Box>

                <Divider sx={{ width: '100%', mb: 2 }} />

                {/* How to Get Started */}
                <Box sx={{ width: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                        How to get started
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
                        Click the <strong>Folder Icon</strong> <FolderPlus size={16} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> in the top right corner to select a folder containing your music.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        Music files will be scanned and added here for you to listen to. Nothing leaves your device. We play music directly from your computer's files.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', opacity: 0.7, mt: 1 }}>
                    <Github size={14} />
                    <Typography variant="caption">
                        <Link href="https://github.com/Connagh/local-music-player-website" target="_blank" rel="noopener" color="inherit" underline="hover">
                            Open Source
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
