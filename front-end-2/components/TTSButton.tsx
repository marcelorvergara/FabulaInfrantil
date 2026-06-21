import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const Btn = styled.button`
  background: transparent;
  border: 1.5px solid rgba(0, 0, 139, 0.22);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s;
  vertical-align: middle;
  &:hover {
    background: rgba(0, 0, 139, 0.07);
    border-color: rgba(0, 0, 139, 0.38);
  }
`;

interface ITTSButtonProps {
  text: string;
}

export default function TTSButton({ text }: ITTSButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  function handleToggle() {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.onend = () => setIsSpeaking(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  }

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <Btn
      onClick={handleToggle}
      title={isSpeaking ? "Parar leitura" : "Ouvir história"}
    >
      {isSpeaking ? "⏹" : "🔊"}
    </Btn>
  );
}
