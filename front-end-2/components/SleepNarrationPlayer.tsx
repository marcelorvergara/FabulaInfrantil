import { useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { ISleepStory } from "@/interfaces/ISleepStory";

const NARRATION_RATE = 0.85;
const NARRATION_PITCH = 0.9;
const RESUME_WATCHDOG_MS = 1000;

function fireGtagEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", eventName, params);
  }
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

export default function SleepNarrationPlayer({ story, onExit }: ISleepNarrationPlayerProps) {
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [playState, setPlayState] = useState<"idle" | "playing" | "paused">("idle");
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sleepTimerHandleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogHandleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedRef = useRef(false);
  const hasFiredHalfwayRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    setSpeechSupported("speechSynthesis" in window);
  }, []);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (sleepTimerHandleRef.current) clearTimeout(sleepTimerHandleRef.current);
      if (watchdogHandleRef.current) clearTimeout(watchdogHandleRef.current);
    };
  }, []);

  const clearSleepTimer = () => {
    if (sleepTimerHandleRef.current) {
      clearTimeout(sleepTimerHandleRef.current);
      sleepTimerHandleRef.current = null;
    }
  };

  const clearWatchdog = () => {
    if (watchdogHandleRef.current) {
      clearTimeout(watchdogHandleRef.current);
      watchdogHandleRef.current = null;
    }
  };

  const resetProgress = () => {
    setPlayState("idle");
    setCurrentParagraphIndex(0);
    hasStartedRef.current = false;
    hasFiredHalfwayRef.current = false;
    startedAtRef.current = null;
  };

  const speakParagraph = (index: number) => {
    if (!("speechSynthesis" in window)) return;

    if (index >= story.paragraphs.length) {
      fireGtagEvent("sleep_story_completed", { story: story.slug });
      clearSleepTimer();
      resetProgress();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(story.paragraphs[index]);
    utterance.lang = "pt-BR";
    utterance.rate = NARRATION_RATE;
    utterance.pitch = NARRATION_PITCH;
    utterance.onend = () => {
      const nextIndex = index + 1;
      const halfway = Math.floor(story.paragraphs.length / 2);
      if (!hasFiredHalfwayRef.current && nextIndex >= halfway) {
        hasFiredHalfwayRef.current = true;
        fireGtagEvent("sleep_story_progress", { story: story.slug });
      }
      setCurrentParagraphIndex(nextIndex);
      speakParagraph(nextIndex);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    if (!("speechSynthesis" in window)) return;

    if (playState === "paused") {
      window.speechSynthesis.resume();
      setPlayState("playing");
      clearWatchdog();
      watchdogHandleRef.current = setTimeout(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.cancel();
          speakParagraph(currentParagraphIndex);
        }
      }, RESUME_WATCHDOG_MS);
      return;
    }

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startedAtRef.current = Date.now();
      fireGtagEvent("sleep_story_started", { story: story.slug });
    }
    setPlayState("playing");
    speakParagraph(currentParagraphIndex);
  };

  const handlePause = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setPlayState("paused");
  };

  const handleStop = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    clearSleepTimer();
    clearWatchdog();
    if (hasStartedRef.current) {
      const listenedMinutes = startedAtRef.current
        ? Math.round(((Date.now() - startedAtRef.current) / 60000) * 10) / 10
        : 0;
      fireGtagEvent("sleep_story_progress", { story: story.slug, listened_minutes: listenedMinutes });
    }
    resetProgress();
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

  if (!speechSupported) {
    return (
      <Wrap>
        <ExitButton onClick={onExit}>‹ Voltar</ExitButton>
        <StoryTitle>{story.title}</StoryTitle>
        <FallbackMessage>
          A narração por voz não está disponível neste navegador.
        </FallbackMessage>
      </Wrap>
    );
  }

  return (
    <Wrap>
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

      <Controls>
        {playState === "playing" ? (
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
