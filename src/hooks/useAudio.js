import { useState, useEffect, useRef, useCallback } from 'react';

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

    // 1. Manage Artwork Blob URL Lifecycle
    useEffect(() => {
        const cleanupArtwork = () => {
            if (artworkUrlRef.current) {
                URL.revokeObjectURL(artworkUrlRef.current);
                artworkUrlRef.current = null;
            }
        };

        if (currentTrack?.picture && currentTrack.picture instanceof Blob) {
            cleanupArtwork();
            try {
                artworkUrlRef.current = URL.createObjectURL(currentTrack.picture);
            } catch (e) {
                console.warn("Failed to create artwork URL", e);
            }
        } else if (!currentTrack) {
            cleanupArtwork();
        }

        return cleanupArtwork;
    }, [currentTrack]);

    // 2. Sync Media Session Metadata & State
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

        if (currentTrack) {
            // Construct artwork array using the stable ref
            let artwork = [];
            if (artworkUrlRef.current && currentTrack.picture) {
                artwork = [
                    {
                        src: artworkUrlRef.current,
                        sizes: '512x512',
                        type: currentTrack.picture.type || 'image/jpeg'
                    }
                ];
            }

            // Always update metadata when track or playing state changes
            // This ensures it persists even if browser clears it (e.g. after pause/play cycle)
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.title || 'Unknown Title',
                artist: currentTrack.artist || 'Unknown Artist',
                album: currentTrack.album || 'Unknown Album',
                artwork: artwork
            });
        } else {
            navigator.mediaSession.metadata = null;
        }

        // Optional: Update position state if needed for perfect integration
        // if (duration > 0) {
        //     navigator.mediaSession.setPositionState({
        //         duration: duration,
        //         playbackRate: 1.0,
        //         position: currentTime
        //     });
        // }

    }, [currentTrack, isPlaying]); // Update on isPlaying to force-refresh metadata on Chrome if needed



    const togglePlay = useCallback(() => {
        if (audioRef.current.paused) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    const playTrack = useCallback(async (track, newQueue = null) => {
        if (newQueue) {
            setQueue(newQueue);
            // Ref will update in effect, but for immediate sync in this function if we were to use it:
            queueRef.current = newQueue;
        }

        const audio = audioRef.current;
        const current = currentTrackRef.current;

        // 1. If same track, just update play/pause state
        if (current?.id === track.id) {
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
    }, [togglePlay]);

    // Helper to get latest play state without closure staleness
    const playNext = useCallback(() => {
        const currentQueue = queueRef.current;
        const current = currentTrackRef.current;

        if (!current || currentQueue.length === 0) return;

        const currentIndex = currentQueue.findIndex(t => t.id === current.id);
        if (currentIndex === -1 || currentIndex === currentQueue.length - 1) return; // End of playlist

        // We need to call playTrack with the CORRECT object. 
        // playTrack itself is stable-ish if it doesn't close over state, 
        // but playTrack does close over queues in some versions? 
        // Let's check playTrack definition. It uses `setQueue` but doesn't seem to rely on other state 
        // except `currentTrack` (which we can fix there too) 
        // Actually, playTrack (line 127) uses `currentTrack?.id` from closure.
        // We should fix playTrack to be ref-aware or pass args.
        playTrack(currentQueue[currentIndex + 1]);
    }, [playTrack]); // playTrack needs to be stable or we need to fix playTrack too.

    const playPrevious = useCallback(() => {
        // If > 3 seconds in, restart song
        if (audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }

        const currentQueue = queueRef.current;
        const current = currentTrackRef.current;

        if (!current || currentQueue.length === 0) return;

        const currentIndex = currentQueue.findIndex(t => t.id === current.id);
        if (currentIndex <= 0) return; // Start of playlist

        playTrack(currentQueue[currentIndex - 1]);
    }, [playTrack]);

    const seek = useCallback((time) => {
        if (Number.isFinite(time)) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const changeVolume = useCallback((vol) => {
        audioRef.current.volume = vol;
        setVolume(vol);
    }, []);

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
    }, [playTrack]); // Changed back to empty array to avoid resetting audio on track/queue change

    // Stabilize Media Session Action Handlers
    // We re-register handlers when currentTrack changes because some browsers (especially iOS) 
    // might reset the session or handlers when the audio source changes.
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        const handlePlay = async () => {
            try {
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (e) {
                console.error("Play failed in media session", e);
            }
        };

        const handlePause = () => {
            audioRef.current.pause();
            setIsPlaying(false);
        };

        const handlePrevioustrack = () => playPrevious();
        const handleNexttrack = () => playNext();

        const handleSeekTo = (details) => {
            if (details.seekTime !== undefined) {
                seek(details.seekTime);
            }
        };

        // Register handlers
        navigator.mediaSession.setActionHandler('play', handlePlay);
        navigator.mediaSession.setActionHandler('pause', handlePause);
        navigator.mediaSession.setActionHandler('previoustrack', handlePrevioustrack);
        navigator.mediaSession.setActionHandler('nexttrack', handleNexttrack);
        navigator.mediaSession.setActionHandler('seekto', handleSeekTo);

        // Explicitly start playing or paused? 
        // No, playbackState is handled in another effect.

        // CRITICAL FOR IOS: Explicitly disable seekbackward/seekforward to force Next/Prev buttons
        // if they are appearing as 10s skips.
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);

        return () => {
            navigator.mediaSession.setActionHandler('play', null);
            navigator.mediaSession.setActionHandler('pause', null);
            navigator.mediaSession.setActionHandler('previoustrack', null);
            navigator.mediaSession.setActionHandler('nexttrack', null);
            navigator.mediaSession.setActionHandler('seekto', null);
            // We don't need to null seekbackward/seekforward strictly, but good practice
            navigator.mediaSession.setActionHandler('seekbackward', null);
            navigator.mediaSession.setActionHandler('seekforward', null);
        };
    }, [currentTrack, playNext, playPrevious, seek]);

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
