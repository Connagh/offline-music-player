import { useState, useCallback, useEffect } from 'react';
import * as mm from 'music-metadata';
import { get, set } from 'idb-keyval';

export function useLibrary() {
    const [tracks, setTracks] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    // Load saved tracks on mount
    useEffect(() => {
        const loadSavedTracks = async () => {
            try {
                const savedTracks = await get('music-tracks');
                if (savedTracks && Array.isArray(savedTracks)) {
                    // Filter out tracks that might be "zombies" (no handle and no file - though file is never saved)
                    // Actually, if we save legacy tracks, they will have no handle. We should probably only load ones with handles?
                    // For now, load everything. UI can handle unplayable.
                    setTracks(savedTracks);
                }
            } catch (e) {
                console.error("Error loading saved tracks:", e);
            }
        };
        loadSavedTracks();
    }, []);

    const parseFile = async (file, handle = null) => {
        try {
            const metadata = await mm.parseBlob(file);
            let picture = null;
            if (metadata.common.picture && metadata.common.picture.length > 0) {
                const pic = metadata.common.picture[0];
                picture = new Blob([pic.data], { type: pic.format });
            }

            return {
                id: Math.random().toString(36).substr(2, 9),
                handle: handle, // Can be null
                file: file, // Keep file for current session (legacy input needs this)
                title: metadata.common.title || file.name,
                artist: metadata.common.artist || 'Unknown Artist',
                album: metadata.common.album || 'Unknown Album',
                duration: metadata.format.duration || 0,
                bitrate: metadata.format.bitrate, // kbps
                sampleRate: metadata.format.sampleRate, // Hz
                format: metadata.format.container,
                picture: picture,
                playCount: 0
            };
        } catch (error) {
            console.warn('Error parsing file:', file.name, error);
            return {
                id: Math.random().toString(36).substr(2, 9),
                handle: handle,
                file: file,
                title: file.name,
                artist: 'Unknown Artist',
                album: 'Unknown Album',
                duration: 0,
                format: 'unknown',
                picture: null
            };
        }
    };

    const addFolder = useCallback(async () => {
        try {
            const dirHandle = await window.showDirectoryPicker();
            setIsScanning(true);
            setProgress({ current: 0, total: 0 });

            const filesToProcess = [];

            async function collectFiles(handle) {
                for await (const entry of handle.values()) {
                    if (entry.kind === 'file') {
                        if (entry.name.match(/\.(m4a|flac|mp3|wav|ogg)$/i)) {
                            filesToProcess.push(entry);
                        }
                    } else if (entry.kind === 'directory') {
                        await collectFiles(entry);
                    }
                }
            }

            await collectFiles(dirHandle);
            setProgress({ current: 0, total: filesToProcess.length });

            const newTracks = [];
            let processed = 0;

            for (const entry of filesToProcess) {
                const file = await entry.getFile();
                const track = await parseFile(file, entry);
                newTracks.push(track);
                processed++;
                setProgress({ current: processed, total: filesToProcess.length });
            }

            setTracks(prev => {
                const updated = [...prev, ...newTracks];

                // OPTIMIZATION: Strip file blobs if handle exists
                const tracksToSave = updated.map(t => {
                    if (t.handle) {
                        const { file, ...rest } = t;
                        return { ...rest, file: null };
                    }
                    return t;
                });

                set('music-tracks', tracksToSave).catch(e => console.error("Error saving updated tracks to IDB:", e));
                return updated;
            });

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error selecting folder:', err);
            }
        } finally {
            setIsScanning(false);
        }
    }, []);

    const addFilesFromInput = useCallback(async (fileList) => {
        setIsScanning(true);
        const files = Array.from(fileList).filter(f => f.name.match(/\.(m4a|flac|mp3|wav|ogg)$/i));
        setProgress({ current: 0, total: files.length });

        const newTracks = [];
        let processed = 0;

        for (const file of files) {
            const track = await parseFile(file, null);
            newTracks.push(track);
            processed++;
            setProgress({ current: processed, total: files.length });
        }

        setTracks(prev => {
            const updated = [...prev, ...newTracks];

            // OPTIMIZATION: Do not save the full 'File' blob to IDB if we have a FileSystemHandle.
            // This prevents hitting storage quotas with large libraries.
            // For legacy inputs (no handle), we must save the file blob to persist it.
            const tracksToSave = updated.map(t => {
                if (t.handle) {
                    // Create a copy without the file blob
                    const { file, ...rest } = t;
                    return { ...rest, file: null };
                }
                return t;
            });

            set('music-tracks', tracksToSave).catch(e => console.error("Error saving updated tracks to IDB:", e));
            return updated;
        });
        setIsScanning(false);
    }, []);

    const resetLibrary = useCallback(async () => {
        try {
            await set('music-tracks', []);
            setTracks([]);
            setProgress({ current: 0, total: 0 });
            // Optional: clear file handles from IDB if we stored separate keys
        } catch (e) {
            console.error("Error resetting library:", e);
        }
    }, []);

    const incrementPlayCount = useCallback((trackId) => {
        setTracks(prev => {
            const trackIndex = prev.findIndex(t => t.id === trackId);
            if (trackIndex === -1) return prev;

            const updated = [...prev];
            const track = { ...updated[trackIndex] };
            track.playCount = (track.playCount || 0) + 1;
            updated[trackIndex] = track;

            // Save logic (similar to addFiles)
            const tracksToSave = updated.map(t => {
                if (t.handle) {
                    const { file, ...rest } = t;
                    return { ...rest, file: null };
                }
                return t;
            });

            set('music-tracks', tracksToSave).catch(e => console.error("Error saving play counts to IDB:", e));
            return updated;
        });
    }, []);

    const exportUserData = useCallback(() => {
        const data = {
            version: 1,
            timestamp: Date.now(),
            playCounts: {},
            playlists: [] // Future placeholder
        };

        tracks.forEach(t => {
            // Always include track to serve as a library snapshot
            // heuristic key: Artist|Title
            const key = `${t.artist}|${t.title}`;
            data.playCounts[key] = t.playCount || 0;
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'music_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [tracks]);

    const importUserData = useCallback(async (file) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.playCounts) {
                throw new Error("Invalid data format: missing playCounts");
            }

            setTracks(prev => {
                const updated = [...prev];
                let changed = false;

                // Create a Map for faster lookup of current tracks? 
                // Since we need to update 'updated' array in place, we iterate the array or the data?
                // Iterating the data (imported keys) is better if data is small.
                // But we need to find the matching track in 'updated'.
                // Let's create a map of "Key -> Index" for current tracks.

                const trackMap = new Map();
                updated.forEach((t, i) => {
                    const key = `${t.artist}|${t.title}`;
                    trackMap.set(key, i);
                });

                Object.entries(data.playCounts).forEach(([key, count]) => {
                    if (trackMap.has(key)) {
                        const index = trackMap.get(key);
                        const currentCount = updated[index].playCount || 0;

                        // Merge Strategy: MAX (Keep highest)
                        if (count > currentCount) {
                            updated[index] = { ...updated[index], playCount: count };
                            changed = true;
                        }
                    }
                });

                if (changed) {
                    // Save to IDB
                    const tracksToSave = updated.map(t => {
                        if (t.handle) {
                            const { file, ...rest } = t;
                            return { ...rest, file: null };
                        }
                        return t;
                    });
                    set('music-tracks', tracksToSave).catch(e => console.error("Error saving imported data:", e));
                    return updated;
                }
                return prev;
            });
            alert("Data imported successfully!"); // Simple feedback
        } catch (e) {
            console.error("Import failed:", e);
            alert("Failed to import data. Check console for details.");
        }
    }, []);

    return { tracks, isScanning, progress, addFolder, addFilesFromInput, resetLibrary, incrementPlayCount, exportUserData, importUserData };
}
