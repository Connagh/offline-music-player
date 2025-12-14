import { useState, useEffect, useRef } from 'react';

export function useAudio(onTrackEnd) {
    const audioRef = useRef(new Audio());
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [currentTrack, setCurrentTrack] = useState(null);

    const [queue, setQueue] = useState([]);

    // Refs to access latest state in event listeners
    const queueRef = useRef(queue);
    const currentTrackRef = useRef(currentTrack);
    const onTrackEndRef = useRef(onTrackEnd);

    const artworkUrlRef = useRef(null); // Ref for Media Session artwork URL
    const currentBlobUrlRef = useRef(null); // Ref for audio source blob URL

    // Keep refs synced
    useEffect(() => {
        queueRef.current = queue;
        currentTrackRef.current = currentTrack;
        onTrackEndRef.current = onTrackEnd;
    }, [queue, currentTrack, onTrackEnd]);

    // Media Session API Integration
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        const cleanupArtwork = () => {
            if (artworkUrlRef.current) {
                URL.revokeObjectURL(artworkUrlRef.current);
                artworkUrlRef.current = null;
            }
        };

        if (currentTrack) {
            // Generate artwork URL if picture exists
            let artwork = [];
            cleanupArtwork(); // Clean previous one first

            if (currentTrack.picture && currentTrack.picture instanceof Blob) {
                try {
                    const url = URL.createObjectURL(currentTrack.picture);
                    artworkUrlRef.current = url;
                    artwork = [
                        { src: url, sizes: '512x512', type: currentTrack.picture.type }
                    ];
                } catch (e) {
                    console.warn("Failed to create artwork URL for Media Session", e);
                }
            }

            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.title || 'Unknown Title',
                artist: currentTrack.artist || 'Unknown Artist',
                album: currentTrack.album || 'Unknown Album',
                artwork: artwork
            });
        } else {
            navigator.mediaSession.metadata = null;
            cleanupArtwork();
        }

        return cleanupArtwork;
    }, [currentTrack]);

    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        navigator.mediaSession.setActionHandler('play', () => {
            // Use ref logic or togglePlay logic if stable
            // Since we can't easily access 'togglePlay' safely if it depends on state that might be stale in a closure
            // unless we re-register. But pure refs are safer.
            // Actually, audioRef is stable.
            audioRef.current.play().catch(e => console.error("Play failed", e));
            setIsPlaying(true);
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            audioRef.current.pause();
            setIsPlaying(false);
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            playPrevious();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            playNext();
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined) {
                seek(details.seekTime);
            }
        });

        // Clear handlers on unmount
        return () => {
            navigator.mediaSession.setActionHandler('play', null);
            navigator.mediaSession.setActionHandler('pause', null);
            navigator.mediaSession.setActionHandler('previoustrack', null);
            navigator.mediaSession.setActionHandler('nexttrack', null);
            navigator.mediaSession.setActionHandler('seekto', null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queue]); // Re-bind when queue changes to ensure next/prev work correct (though they use refs internally in some designs, here playNext depends on queue/currentTrack state linkage)

    useEffect(() => {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }, [isPlaying]);

    useEffect(() => {
        const audio = audioRef.current; // Stable ref

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handleEnded = () => {
            // Use refs to get latest state without re-binding listener
            const currentQueue = queueRef.current;
            const current = currentTrackRef.current;

            if (current) {
                // Trigger callback if provided
                if (onTrackEndRef.current) {
                    onTrackEndRef.current(current);
                }
            }

            if (!current || currentQueue.length === 0) return;

            const currentIndex = currentQueue.findIndex(t => t.id === current.id);
            if (currentIndex === -1 || currentIndex === currentQueue.length - 1) {
                setIsPlaying(false);
                return;
            }

            // We can't call playTrack directly easily because it's async and depends on state
            // But we can manually trigger the next track logic here
            const nextTrack = currentQueue[currentIndex + 1];
            playTrack(nextTrack);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
            audio.src = '';

            // Clean up any lingering blob URL on unmount
            if (currentBlobUrlRef.current) {
                URL.revokeObjectURL(currentBlobUrlRef.current);
                currentBlobUrlRef.current = null;
            }
        };
    }, []); // Changed back to empty array to avoid resetting audio on track/queue change

    const playTrack = async (track, newQueue = null) => {
        if (newQueue) {
            setQueue(newQueue);
            // Ref will update in effect, but for immediate sync in this function if we were to use it:
            queueRef.current = newQueue;
        }

        const audio = audioRef.current;

        // 1. If same track, just update play/pause state
        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        // 2. Cleanup previous track
        if (audio.src) {
            audio.pause();
            // Do NOT revoke audio.src directly if we are managing it via ref, 
            // but for safety in legacy mode we normally would. 
            // Here we rely on currentBlobUrlRef.
            audio.removeAttribute('src'); // Clear src
        }

        // Fix: Revoke old blob URL
        if (currentBlobUrlRef.current) {
            URL.revokeObjectURL(currentBlobUrlRef.current);
            currentBlobUrlRef.current = null;
        }

        // 3. Resolve the File
        let file = track.file;

        // If no direct file (refresh case), try to resolve from handle
        if (!file && track.handle) {
            try {
                // Verify permission
                if ((await track.handle.queryPermission({ mode: 'read' })) !== 'granted') {
                    // This request must be triggered by user activation.
                    // Since playTrack is called from onClick, it should work, 
                    // BUT async/await boundaries can sometimes break gesture token tracking in strict browsers.
                    // However, requestPermission is usually lenient if close enough in call stack.
                    const perm = await track.handle.requestPermission({ mode: 'read' });
                    if (perm !== 'granted') {
                        console.warn("Permission denied for file handle");
                        return;
                    }
                }
                file = await track.handle.getFile();
            } catch (e) {
                console.error("Error retrieving file from handle", e);
                return;
            }
        }

        if (!file || !(file instanceof Blob)) {
            console.error("Invalid file object:", file);
            return;
        }

        // 4. Play
        try {
            const url = URL.createObjectURL(file);
            currentBlobUrlRef.current = url; // Store ref

            audio.src = url;
            audio.load(); // Ensure it loads

            await audio.play();

            // Only update state if play succeeded
            setIsPlaying(true);
            setCurrentTrack(track);
            // Sync ref immediately for safety
            currentTrackRef.current = track;
        } catch (e) {
            console.error("Playback failed:", e);
            // Don't set isPlaying true if failed
            setIsPlaying(false);

            // Cleanup on failure
            if (currentBlobUrlRef.current) {
                URL.revokeObjectURL(currentBlobUrlRef.current);
                currentBlobUrlRef.current = null;
            }
        }
    };

    const playNext = () => {
        if (!currentTrack || queue.length === 0) return;
        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex === -1 || currentIndex === queue.length - 1) return; // End of playlist
        playTrack(queue[currentIndex + 1]);
    };

    const playPrevious = () => {
        // If > 3 seconds in, restart song
        if (audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }

        if (!currentTrack || queue.length === 0) return;
        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex <= 0) return; // Start of playlist
        playTrack(queue[currentIndex - 1]);
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const seek = (time) => {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const changeVolume = (vol) => {
        audioRef.current.volume = vol;
        setVolume(vol);
    };

    return {
        isPlaying,
        currentTime,
        duration,
        volume,
        currentTrack,
        playTrack,
        playNext,
        playPrevious,
        togglePlay,
        seek,
        changeVolume
    };
}
