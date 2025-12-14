import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudio(onTrackEnd) {
    const audioRef = useRef(null); // Ref will be attached to <audio> element in App
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

    const nextTrackBlobUrlRef = useRef(null);
    const nextTrackIdRef = useRef(null);

    // Keep refs synced
    useEffect(() => {
        queueRef.current = queue;
        currentTrackRef.current = currentTrack;
        onTrackEndRef.current = onTrackEnd;
    }, [queue, currentTrack, onTrackEnd]);

    // Preload Next Track Logic
    // This ensures that when the user presses "Next", we have the Blob URL ready 
    // and can swap the src SYNCHRONOUSLY, preserving the User Gesture token.
    useEffect(() => {
        const prepareNextTrack = async () => {
            const current = currentTrack; // Closure capture or use ref?
            const currentQ = queue;

            if (!current || currentQ.length === 0) return;

            const currentIndex = currentQ.findIndex(t => t.id === current.id);
            if (currentIndex === -1 || currentIndex === currentQ.length - 1) {
                // No next track
                if (nextTrackBlobUrlRef.current) {
                    URL.revokeObjectURL(nextTrackBlobUrlRef.current);
                    nextTrackBlobUrlRef.current = null;
                    nextTrackIdRef.current = null;
                }
                return;
            }

            const nextTrack = currentQ[currentIndex + 1];

            // If already preloaded, skip
            if (nextTrackIdRef.current === nextTrack.id && nextTrackBlobUrlRef.current) {
                return;
            }

            // Clean up old preload
            if (nextTrackBlobUrlRef.current) {
                URL.revokeObjectURL(nextTrackBlobUrlRef.current);
                nextTrackBlobUrlRef.current = null;
                nextTrackIdRef.current = null;
            }

            // Fetch
            try {
                let file = nextTrack.file;
                if (!file && nextTrack.handle) {
                    // Optimistically try to get file. validation of permission should happen on interaction or assume granted.
                    // queryPermission might block in background.
                    file = await nextTrack.handle.getFile();
                }

                if (file && (file instanceof Blob)) {
                    const url = URL.createObjectURL(file);
                    nextTrackBlobUrlRef.current = url;
                    nextTrackIdRef.current = nextTrack.id;
                    // console.log("Preloaded next track:", nextTrack.title);
                }
            } catch (e) {
                console.warn("Failed to preload next track", e);
            }
        };

        prepareNextTrack();
    }, [currentTrack, queue]);


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
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }, [isPlaying]);

    const [history, setHistory] = useState([]);
    const historyRef = useRef(history);

    useEffect(() => {
        historyRef.current = history;
    }, [history]);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    const playTrack = useCallback(async (track, newQueue = null, options = {}) => {
        const { skipHistory = false } = options;

        if (!audioRef.current) return;
        if (newQueue) {
            setQueue(newQueue);
            // Ref will update in effect, but for immediate sync in this function if we were to use it:
            queueRef.current = newQueue;
        }

        const audio = audioRef.current;
        const current = currentTrackRef.current;

        // 1. If same track, just update play/pause state
        // Note: Use weak comparison or id check
        if (current?.id === track.id) {
            togglePlay();
            return;
        }

        // ADDED: Shuffle History Logic
        // If we have a current track and we aren't skipping history (e.g. going back),
        // add the current track to history.
        if (current && !skipHistory) {
            setHistory(prev => [...prev, current]);
        }

        let url = null;
        let isPreloaded = false;

        // 2. CHECK PRELOAD FIRST
        if (nextTrackIdRef.current === track.id && nextTrackBlobUrlRef.current) {
            url = nextTrackBlobUrlRef.current;
            isPreloaded = true;
            // Clear refs so we don't revoke it as "old"
            nextTrackBlobUrlRef.current = null;
            nextTrackIdRef.current = null;
        }

        // 3. Resolve the File (ASYNC) if not preloaded
        // Do this BEFORE pausing to keep session alive
        if (!url) {
            let file = track.file;

            // If no direct file (refresh case), try to resolve from handle
            if (!file && track.handle) {
                try {
                    // Optimistically try to get file. 
                    // Explicit permission queries can hang in background or on iOS.
                    file = await track.handle.getFile();
                } catch (e) {
                    console.error("Error retrieving file from handle", e);
                    // If this fails, we can't play. 
                    // Maybe trigger a permission prompt if we were in foreground? 
                    // But we can't know for sure.
                    return;
                }
            }

            if (!file || !(file instanceof Blob)) {
                console.error("Invalid file object:", file);
                return;
            }
            url = URL.createObjectURL(file);
        }
        // 4. STOP and SWAP (Synchronous part)
        // Now we swap safely.
        if (audio.src) {
            audio.pause();
            // We don't strictly need to removeAttribute 'src' if we overwrite it immediately.
            // Leaving it effectively "swaps" the stream.
        }

        // Cleanup old blob URL
        if (currentBlobUrlRef.current) {
            URL.revokeObjectURL(currentBlobUrlRef.current);
        }
        currentBlobUrlRef.current = url; // Update ref

        // 5. Play
        try {
            audio.src = url;
            // Removed audio.load() to minimize buffering gap for gapless-like transition

            await audio.play();

            // Only update state if play succeeded
            setIsPlaying(true);
            setCurrentTrack(track);
            // Sync ref immediately for safety
            currentTrackRef.current = track;

            // IMMEDIATE SYNCHRONOUS METADATA UPDATE
            // This is critical for iOS Lock Screen to update instantly without waiting for React cycle
            if ('mediaSession' in navigator) {
                // Cleanup previous artwork url if needed
                if (artworkUrlRef.current) URL.revokeObjectURL(artworkUrlRef.current);
                artworkUrlRef.current = null;

                let artwork = [];
                if (track.picture && track.picture instanceof Blob) {
                    try {
                        const artUrl = URL.createObjectURL(track.picture);
                        artworkUrlRef.current = artUrl;
                        artwork = [{ src: artUrl, sizes: '512x512', type: track.picture.type }];
                    } catch (e) { console.warn("Artwork fail", e); }
                }

                navigator.mediaSession.metadata = new MediaMetadata({
                    title: track.title || 'Unknown Title',
                    artist: track.artist || 'Unknown Artist',
                    album: track.album || 'Unknown Album',
                    artwork: artwork
                });

                navigator.mediaSession.playbackState = 'playing';

                // Ensure position state is hinted if possible
                if ('setPositionState' in navigator.mediaSession) {
                    navigator.mediaSession.setPositionState({
                        duration: audio.duration || 0,
                        playbackRate: audio.playbackRate || 1,
                        position: 0
                    });
                }
            }

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

    const [isShuffle, setIsShuffle] = useState(false);
    const isShuffleRef = useRef(isShuffle);

    useEffect(() => {
        isShuffleRef.current = isShuffle;
    }, [isShuffle]);

    const toggleShuffle = useCallback(() => setIsShuffle(p => !p), []);

    // Helper to get latest play state without closure staleness
    const playNext = useCallback(() => {
        const currentQueue = queueRef.current;
        const current = currentTrackRef.current;

        if (!current || currentQueue.length === 0) return;

        if (isShuffleRef.current) {
            // Shuffle Logic: Pick random
            const nextIndex = Math.floor(Math.random() * currentQueue.length);
            playTrack(currentQueue[nextIndex]);
            return;
        }

        const currentIndex = currentQueue.findIndex(t => t.id === current.id);
        if (currentIndex === -1 || currentIndex === currentQueue.length - 1) return; // End of playlist

        playTrack(currentQueue[currentIndex + 1]);
    }, [playTrack]); // playTrack needs to be stable or we need to fix playTrack too.

    const playPrevious = useCallback(() => {
        if (!audioRef.current) return;
        // If > 3 seconds in, restart song
        if (audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }

        const currentQueue = queueRef.current;
        const current = currentTrackRef.current;

        if (!current) return;

        // ADDED: Shuffle History Check
        if (isShuffleRef.current && historyRef.current.length > 0) {
            const newHistory = [...historyRef.current];
            const previousTrack = newHistory.pop();

            setHistory(newHistory); // Update history state
            playTrack(previousTrack, null, { skipHistory: true });
            return;
        }

        if (currentQueue.length === 0) return;

        const currentIndex = currentQueue.findIndex(t => t.id === current.id);
        if (currentIndex <= 0) return; // Start of playlist

        playTrack(currentQueue[currentIndex - 1]);
    }, [playTrack]);

    const seek = useCallback((time) => {
        if (!audioRef.current) return;
        if (Number.isFinite(time)) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const changeVolume = useCallback((vol) => {
        if (!audioRef.current) return;
        audioRef.current.volume = vol;
        setVolume(vol);
    }, []);

    useEffect(() => {
        const audio = audioRef.current; // Stable ref
        if (!audio) return;

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
        if (!audioRef.current) return;

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
        audioRef, // EXPOSED REF
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
        changeVolume,
        isShuffle,
        toggleShuffle
    };
}
