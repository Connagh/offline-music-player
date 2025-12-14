import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, List, ListItem, ListItemText, ListItemIcon, Divider, Alert } from '@mui/material';
import { RefreshCw, Trash2, FolderPlus, AlertTriangle, HardDrive } from 'lucide-react';

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function SettingsDialog({ open, onClose, onReset, onExport, onImport }) {
    const [confirmReset, setConfirmReset] = useState(false);
    const [storageUsage, setStorageUsage] = useState(null);

    useEffect(() => {
        if (open && 'storage' in navigator && 'estimate' in navigator.storage) {
            navigator.storage.estimate().then(estimate => {
                setStorageUsage(estimate.usage);
            }).catch(e => console.error("Storage estimate failed:", e));
        }
    }, [open]);

    const handleClose = () => {
        setConfirmReset(false);
        onClose();
    };

    const handleResetClick = () => {
        if (confirmReset) {
            onReset();
            setConfirmReset(false);
            setStorageUsage(0); // Optimistically clear
        } else {
            setConfirmReset(true);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}>
            <DialogTitle>Settings</DialogTitle>
            <DialogContent>
                <List>
                    {/* Storage Info */}
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <HardDrive size={24} color="#a1a1aa" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Storage Used"
                                secondary={storageUsage !== null ? formatBytes(storageUsage) : "Calculating..."}
                            />
                        </Box>
                        {storageUsage > 100 * 1024 * 1024 && (
                            <Alert severity="info" size="small" variant="outlined">
                                High storage usage helps verify that your music is saved locally in this browser.
                            </Alert>
                        )}
                    </ListItem>

                    <Divider variant="inset" component="li" />

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
                                startIcon={<RefreshCw size={16} />}
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
