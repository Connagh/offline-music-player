import React from 'react';
import { Box, Paper } from '@mui/material';

export function Layout({ children, playerBar }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
            <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {children}
            </Box>
            <Paper
                elevation={0}
                sx={{
                    height: 96,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    zIndex: 10,
                    borderRadius: 0
                }}
            >
                {playerBar}
            </Paper>
        </Box>
    );
}
