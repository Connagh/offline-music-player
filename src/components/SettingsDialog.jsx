import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, List, ListItem, ListItemText, ListItemIcon, Divider, Alert } from '@mui/material';
import { RefreshCw, Trash2, FolderPlus, AlertTriangle } from 'lucide-react';

export function SettingsDialog({ open, onClose, onReset, onExport, onImport }) {
    const [confirmReset, setConfirmReset] = useState(false);

    const handleClose = () => {
        setConfirmReset(false);
        onClose();
    };

    const handleResetClick = () => {
        if (confirmReset) {
            onReset();
            setConfirmReset(false);
        } else {
            setConfirmReset(true);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}>
            <DialogTitle>Settings</DialogTitle>
            <DialogContent>
                <List>
                    {/* Data Management */}
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <FolderPlus size={24} color="#3b82f6" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Data Management"
                                secondary="Export your play history to sync with other devices."
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, paddingLeft: 7 }}>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshCw size={16} />} // Reuse RefreshCw as 'Sync' icon substitute or Import? Upload is better but I don't have it imported.
                                // Actually let's just use text for clarity or import 'Upload'/'Download' from lucide if available.
                                // I'll use FolderPlus for Import maybe? And something else for Export.
                                // Let's just use Text for now to be safe on imports, or reuse existing.
                                onClick={onExport}
                            >
                                Export Data
                            </Button>
                            <Button
                                variant="outlined"
                                component="label"
                            >
                                Import Data
                                <input
                                    type="file"
                                    hidden
                                    accept=".json"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            onImport(e.target.files[0]);
                                            e.target.value = ''; // Reset
                                        }
                                    }}
                                />
                            </Button>
                        </Box>
                    </ListItem>

                    <Divider variant="inset" component="li" />


                    <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <Trash2 size={24} color="#ef4444" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Reset Local Data"
                                secondary="Clear all tracks and metadata from this browser."
                                primaryTypographyProps={{ color: 'error.main' }}
                            />
                        </Box>

                        {confirmReset ? (
                            <Alert
                                severity="warning"
                                icon={<AlertTriangle size={20} />}
                                action={
                                    <Button color="error" size="small" variant="contained" onClick={handleResetClick}>
                                        Confirm Reset
                                    </Button>
                                }
                                sx={{ width: '100%' }}
                            >
                                Are you sure? This cannot be undone.
                            </Alert>
                        ) : (
                            <Button variant="outlined" color="error" onClick={handleResetClick} sx={{ alignSelf: 'flex-end' }}>
                                Reset Data
                            </Button>
                        )}
                    </ListItem>
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
