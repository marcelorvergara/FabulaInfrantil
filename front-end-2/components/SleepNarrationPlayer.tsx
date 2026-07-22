import { useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { ISleepStory } from "@/interfaces/ISleepStory";

const VOICE_STORAGE_KEY = "modo_soninho_voice";
const FADE_MS = 300;

// End-of-story ambient noise tail - see ship-white-noise.ts for how this file
// is generated (synthesized brown noise, baked quiet so it's still ambient-level
// on iOS Safari, where HTMLMediaElement.volume can't be set - see fadeVolume below).
const NOISE_LOOP_URL = "https://storage.googleapis.com/images-gen/sleep-audio/ambient-brown-noise.mp3";
const NOISE_TARGET_VOLUME = 1.0;
const NOISE_FADE_MS = 2500;
// Bounded tail when no sleep timer was chosen, so the loop doesn't run all
// night unattended if nobody set a timer and nobody comes back to tap Stop.
const NOISE_DEFAULT_MINUTES = 15;

function fireGtagEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", eventName, params);
  }
}

/** Last paragraph index whose start timestamp has already been reached. */
function paragraphIndexForElapsedMs(elapsedMs: number, timestamps: number[]): number {
  let idx = 0;
  for (let i = 0; i < timestamps.length; i++) {
    if (elapsedMs >= timestamps[i]) idx = i;
  }
  return idx;
}

/**
 * Ramps audio.volume over `durationMs`. No-op in effect (but harmless) on iOS
 * Safari, where HTMLMediaElement.volume is effectively read-only - the OS
 * owns hardware volume there, so a voice switch is a hard cut on iOS by
 * design for this version. Fixing that for real would mean a Web Audio
 * GainNode - which needs crossOrigin="anonymous" on this element PLUS a
 * matching CORS rule on the GCS bucket (not currently configured; plain
 * <audio src> playback doesn't need either, which is why neither is set).
 */
function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  durationMs: number,
  onDone: () => void,
  intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
) {
  if (intervalRef.current) clearInterval(intervalRef.current);
  const steps = 12;
  const stepMs = durationMs / steps;
  let i = 0;
  audio.volume = from;
  intervalRef.current = setInterval(() => {
    i++;
    audio.volume = Math.min(1, Math.max(0, from + (to - from) * (i / steps)));
    if (i >= steps) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      audio.volume = to;
      onDone();
    }
  }, stepMs);
}

interface ISleepNarrationPlayerProps {
  story: ISleepStory;
  onExit: () => void;
}

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const Wrap = styled.div`
  max-width: 560px;
  margin: 0 auto;
  padding: 8px 20px 40px;
  text-align: center;
`;

const ExitButton = styled.button`
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.85rem;
  cursor: pointer;
  margin-bottom: 24px;
  padding: 8px;

  &:hover {
    color: rgba(255, 255, 255, 0.85);
  }
`;

const StoryTitle = styled.h2`
  color: #ffd700;
  font-size: 1.2rem;
  margin: 0 0 28px 0;
`;

const ParagraphText = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(1.05rem, 3vw, 1.3rem);
  line-height: 1.8;
  min-height: 4.5em;
  margin: 0 0 28px 0;
`;

const ProgressRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
`;

const ProgressDot = styled.span<{ $filled: boolean; $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => (props.$filled ? "#ffd700" : "rgba(255, 255, 255, 0.2)")};
  animation: ${(props) => (props.$active ? css`${pulse} 1.6s ease-in-out infinite` : "none")};
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const ControlButton = styled.button`
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  background: transparent;
  border: 1.5px solid rgba(255, 215, 0, 0.4);
  border-radius: 50%;
  width: 52px;
  height: 52px;
  font-size: 1.2rem;
  color: #ffd700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: rgba(255, 215, 0, 0.08);
    border-color: rgba(255, 215, 0, 0.7);
  }
`;

const VoiceToggle = styled.button`
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.8rem;
  padding: 6px 14px;
  margin: 0 0 24px 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.95);
  }
`;

const SleepTimerRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
`;

const SleepTimerSelect = styled.select`
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.85);
  padding: 6px 10px;
  font-size: 0.85rem;
`;

const FallbackMessage = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
`;

const NoiseLabel = styled.p`
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.9rem;
  font-style: italic;
  margin: 0 0 24px 0;
`;

export default function SleepNarrationPlayer({ story, onExit }: ISleepNarrationPlayerProps) {
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [playState, setPlayState] = useState<"idle" | "playing" | "paused" | "noise">("idle");
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const noiseAudioRef = useRef<HTMLAudioElement | null>(null);
  const sleepTimerHandleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noiseFadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);
  const hasFiredHalfwayRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const noiseStartedAtRef = useRef<number | null>(null);
  const pendingAutoplayRef = useRef(false);
  // Unlocks the noise <audio> element for later gesture-less play() once,
  // inside handlePlay's real user gesture - see handlePlay below.
  const noisePrimedRef = useRef(false);
  // Mirrors playState for use inside long-lived setTimeout closures (the
  // sleep timer, the no-timer noise fallback) and the media-session action
  // handlers - those closures freeze whatever `playState` was at the render
  // they were scheduled/registered in, which is stale by the time they fire.
  // handleStop reads this ref instead of the `playState` state variable so
  // it always branches on the CURRENT phase regardless of who calls it.
  const playStateRef = useRef<"idle" | "playing" | "paused" | "noise">("idle");

  const currentVoice = story.voices[voiceIndex];

  // Read the stored voice preference on mount, AFTER hydration - never in the
  // useState initializer above, since /modo-soninho is statically generated
  // and the server-rendered HTML always reflects voices[0]. Reading
  // localStorage in the initializer would make a returning user's client
  // render disagree with that HTML and trigger a hydration mismatch.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VOICE_STORAGE_KEY);
      const matchIndex = story.voices.findIndex((v) => v.engine === stored);
      if (matchIndex >= 0) setVoiceIndex(matchIndex);
    } catch {
      // localStorage unavailable (private mode, disabled) - just use the default voice
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (sleepTimerHandleRef.current) clearTimeout(sleepTimerHandleRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (noiseFadeIntervalRef.current) clearInterval(noiseFadeIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    playStateRef.current = playState;
  }, [playState]);

  const clearSleepTimer = () => {
    if (sleepTimerHandleRef.current) {
      clearTimeout(sleepTimerHandleRef.current);
      sleepTimerHandleRef.current = null;
    }
  };

  const resetProgress = () => {
    setPlayState("idle");
    setCurrentParagraphIndex(0);
    hasStartedRef.current = false;
    hasFiredHalfwayRef.current = false;
    startedAtRef.current = null;
    noiseStartedAtRef.current = null;
  };

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // One-time, inside this real user gesture: silently play+pause the noise
    // element so iOS Safari treats it as unlocked for the later gesture-less
    // play() call in enterNoisePhase() when the story ends. Without this, the
    // end-of-story noise tail silently never plays on iOS - the narration
    // element got unlocked by this same gesture, but the noise element is a
    // separate <audio> that's never been played from a tap.
    if (!noisePrimedRef.current) {
      noisePrimedRef.current = true;
      const noiseAudio = noiseAudioRef.current;
      if (noiseAudio) {
        noiseAudio.muted = true;
        noiseAudio
          .play()
          .then(() => {
            noiseAudio.pause();
            noiseAudio.currentTime = 0;
            noiseAudio.muted = false;
          })
          .catch(() => {
            // Priming failed - the noise tail will fail silently later via
            // enterNoisePhase's own .catch(), no worse than before this existed.
          });
      }
    }

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startedAtRef.current = Date.now();
      fireGtagEvent("sleep_story_started", { story: story.slug, voice: currentVoice.engine });
    }
    setPlayState("playing");
    audio.play().catch(() => {
      // Autoplay/gesture rejection - settle into a clean paused state rather
      // than looking like it's playing while silent.
      setPlayState("paused");
    });
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setPlayState("paused");
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    const noiseAudio = noiseAudioRef.current;
    if (noiseAudio) {
      noiseAudio.pause();
      noiseAudio.currentTime = 0;
    }
    clearSleepTimer();

    // Branch on playStateRef (not the playState state variable, and not just
    // hasStartedRef) so a stop from the noise phase reports noise listening
    // time instead of double-reporting narration progress for a story that
    // already fired sleep_story_completed - and stays correct even when this
    // is invoked from a setTimeout/media-session closure scheduled in an
    // earlier, now-stale render (see playStateRef's declaration comment).
    if (playStateRef.current === "noise") {
      const noiseMinutes = noiseStartedAtRef.current
        ? Math.round(((Date.now() - noiseStartedAtRef.current) / 60000) * 10) / 10
        : 0;
      fireGtagEvent("sleep_noise_stopped", {
        story: story.slug,
        voice: currentVoice.engine,
        noise_minutes: noiseMinutes,
      });
    } else if (hasStartedRef.current) {
      const listenedMinutes = startedAtRef.current
        ? Math.round(((Date.now() - startedAtRef.current) / 60000) * 10) / 10
        : 0;
      fireGtagEvent("sleep_story_progress", {
        story: story.slug,
        voice: currentVoice.engine,
        listened_minutes: listenedMinutes,
      });
    }
    resetProgress();
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const elapsedMs = audio.currentTime * 1000;
    const index = paragraphIndexForElapsedMs(elapsedMs, currentVoice.paragraphTimestamps);
    setCurrentParagraphIndex(index);

    const halfway = Math.floor(story.paragraphs.length / 2);
    if (!hasFiredHalfwayRef.current && index >= halfway) {
      hasFiredHalfwayRef.current = true;
      fireGtagEvent("sleep_story_progress", { story: story.slug, voice: currentVoice.engine });
    }
  };

  const handleEnded = () => {
    fireGtagEvent("sleep_story_completed", { story: story.slug, voice: currentVoice.engine });
    enterNoisePhase();
  };

  // Story finished naturally - crossfade into the ambient noise loop instead
  // of going silent, since sudden silence is exactly what wakes a drowsy
  // child. Deliberately does NOT call clearSleepTimer(): if a sleep timer was
  // set and hasn't elapsed yet, it keeps counting down and its existing
  // handleStop callback now stops the noise too - so "30 minutos" means 30
  // minutes of sleep environment, not capped at whichever story's length. If
  // no timer was set, arm a bounded fallback so the loop doesn't run all
  // night unattended.
  const enterNoisePhase = () => {
    setPlayState("noise");
    noiseStartedAtRef.current = Date.now();
    fireGtagEvent("sleep_noise_started", { story: story.slug, voice: currentVoice.engine });

    const noiseAudio = noiseAudioRef.current;
    if (noiseAudio) {
      noiseAudio.volume = 0;
      noiseAudio
        .play()
        .then(() => {
          fadeVolume(noiseAudio, 0, NOISE_TARGET_VOLUME, NOISE_FADE_MS, () => {}, noiseFadeIntervalRef);
        })
        .catch(() => {
          // Autoplay rejected (priming failed or unsupported browser) - no
          // ambient sound plays, but nothing else breaks; Stop still works.
        });
    }

    if (sleepTimerMinutes === null) {
      sleepTimerHandleRef.current = setTimeout(() => {
        handleStop();
      }, NOISE_DEFAULT_MINUTES * 60_000);
    }
  };

  const handleSleepTimerChange = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    clearSleepTimer();
    if (minutes !== null) {
      sleepTimerHandleRef.current = setTimeout(() => {
        handleStop();
      }, minutes * 60_000);
    }
  };

  // Switching voice restarts the story from the beginning on the new voice,
  // rather than trying to resume at an equivalent position - different
  // engines pace speech differently, so "the same position" isn't meaningfully
  // defined across two voices' paragraphTimestamps. The sleep timer (if set)
  // is intentionally left running across a switch; only playback progress resets.
  const handleSwitchVoice = (nextIndex: number) => {
    if (nextIndex === voiceIndex || !story.voices[nextIndex]) return;

    try {
      window.localStorage.setItem(VOICE_STORAGE_KEY, story.voices[nextIndex].engine);
    } catch {
      // localStorage unavailable - preference just won't persist
    }

    const audio = audioRef.current;
    const wasPlaying = playState === "playing";
    pendingAutoplayRef.current = wasPlaying;

    const commitSwitch = () => {
      if (hasStartedRef.current) {
        const listenedMinutes = startedAtRef.current
          ? Math.round(((Date.now() - startedAtRef.current) / 60000) * 10) / 10
          : 0;
        fireGtagEvent("sleep_story_progress", {
          story: story.slug,
          voice: currentVoice.engine,
          listened_minutes: listenedMinutes,
        });
      }
      resetProgress();
      setVoiceIndex(nextIndex);
    };

    if (audio && wasPlaying) {
      fadeVolume(audio, 1, 0, FADE_MS, commitSwitch, fadeIntervalRef);
    } else {
      commitSwitch();
    }
  };

  // Runs after the <audio> element remounts (key={engine} below) on a voice
  // switch that happened mid-playback - resumes playback on the new voice.
  useEffect(() => {
    if (!pendingAutoplayRef.current) return;
    pendingAutoplayRef.current = false;
    const audio = audioRef.current;
    if (!audio) return;

    hasStartedRef.current = true;
    startedAtRef.current = Date.now();
    fireGtagEvent("sleep_story_started", { story: story.slug, voice: currentVoice.engine });

    audio.volume = 0;
    audio
      .play()
      .then(() => {
        setPlayState("playing");
        fadeVolume(audio, 0, 1, FADE_MS, () => {}, fadeIntervalRef);
      })
      .catch(() => {
        audio.volume = 1;
        setPlayState("paused");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceIndex]);

  // Lock-screen controls: lets a parent pause/stop without lighting up the phone.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: story.title });
    navigator.mediaSession.setActionHandler("play", handlePlay);
    navigator.mediaSession.setActionHandler("pause", handlePause);
    navigator.mediaSession.setActionHandler("stop", handleStop);
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, voiceIndex]);

  if (!currentVoice) {
    return (
      <Wrap>
        <ExitButton onClick={onExit}>‹ Voltar</ExitButton>
        <StoryTitle>{story.title}</StoryTitle>
        <FallbackMessage>Narração ainda não disponível para esta história.</FallbackMessage>
      </Wrap>
    );
  }

  if (loadError) {
    return (
      <Wrap>
        <ExitButton onClick={onExit}>‹ Voltar</ExitButton>
        <StoryTitle>{story.title}</StoryTitle>
        <FallbackMessage>
          Não foi possível carregar a narração desta história. Tente novamente mais tarde.
        </FallbackMessage>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <audio
        key={currentVoice.engine}
        ref={audioRef}
        src={currentVoice.audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => setLoadError(true)}
        style={{ display: "none" }}
      />

      {/* End-of-story ambient noise tail. Not remounted on voice switch (no
          key prop) - it's one shared loop independent of narration voice. */}
      <audio ref={noiseAudioRef} src={NOISE_LOOP_URL} loop preload="none" style={{ display: "none" }} />

      <ExitButton onClick={onExit}>‹ Voltar</ExitButton>
      <StoryTitle>{story.title}</StoryTitle>

      <ParagraphText>
        {story.paragraphs[Math.min(currentParagraphIndex, story.paragraphs.length - 1)]}
      </ParagraphText>

      <ProgressRow>
        {story.paragraphs.map((_, i) => (
          <ProgressDot
            key={i}
            $filled={i <= currentParagraphIndex}
            $active={i === currentParagraphIndex && playState === "playing"}
          />
        ))}
      </ProgressRow>

      {playState === "noise" && <NoiseLabel>🌙 Som suave tocando para embalar o sono...</NoiseLabel>}

      <Controls>
        {playState === "noise" ? null : playState === "playing" ? (
          <ControlButton onClick={handlePause} title="Pausar">
            ⏸
          </ControlButton>
        ) : (
          <ControlButton onClick={handlePlay} title="Ouvir">
            ▶
          </ControlButton>
        )}
        <ControlButton onClick={handleStop} title="Parar">
          ⏹
        </ControlButton>
      </Controls>

      {story.voices.length > 1 && (
        <VoiceToggle
          onClick={() => handleSwitchVoice((voiceIndex + 1) % story.voices.length)}
          title="Trocar voz"
        >
          🔊 {currentVoice.label}
        </VoiceToggle>
      )}

      <SleepTimerRow>
        <label htmlFor="sleep-timer">Parar sozinho em:</label>
        <SleepTimerSelect
          id="sleep-timer"
          value={sleepTimerMinutes ?? ""}
          onChange={(e) =>
            handleSleepTimerChange(e.target.value === "" ? null : Number(e.target.value))
          }
        >
          <option value="">Até o fim da história</option>
          <option value="5">5 minutos</option>
          <option value="15">15 minutos</option>
          <option value="30">30 minutos</option>
        </SleepTimerSelect>
      </SleepTimerRow>
    </Wrap>
  );
}
