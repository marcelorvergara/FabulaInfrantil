import { useEffect, useState } from "react";
import styled, { css } from "styled-components";

const AGE_OPTIONS = [
  { value: "0_3", label: "0 a 3 anos", emoji: "🍼" },
  { value: "4_7", label: "4 a 7 anos", emoji: "🌟" },
  { value: "8_11", label: "8 a 11 anos", emoji: "🚀" },
  { value: "12_14", label: "12 a 14 anos", emoji: "🔮" },
];

const CenterFP = styled.section`
  width: 95%;
  margin: 6px auto;
`;

const FPDiv = styled.div<TSStyledClickd>`
  cursor: pointer;
  height: 870px;
  width: 310px;
  margin-top: 3px;
  background-color: #e4e4e4;
  border-radius: 2px 20px 20px 2px;
  transform: rotateX(10deg);
  transform-origin: center left;
  color: darkblue;
  font-size: 1.2rem;
  position: absolute;
  z-index: -2;
  /* the cover only opens once */
  ${(props) => {
    if (props.hasClicked) {
      return css`
        z-index: 1;
        transform: rotateX(10deg) rotateY(-180deg);
        transition-duration: 3s;
      `;
    }
    return "";
  }}
`;

const Content = styled.div<TSStyledClickd>`
  /* hide content when page has changed */
  ${(props) => {
    if (props.hasClicked) {
      return css`
        transition-delay: 1s;
        display: none;
        visibility: hidden;
      `;
    }
    return "";
  }}
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 840px;
  padding: 0 24px;
  box-sizing: border-box;
`;

const Decoration = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
`;

const Prompt = styled.h2`
  font-family: "Courier New", Courier, monospace;
  font-size: 0.95rem;
  color: #3c3c5c;
  text-align: center;
  margin-bottom: 8px;
  line-height: 1.6;
  font-weight: bold;
`;

const Hint = styled.p`
  font-size: 0.72rem;
  color: #888;
  text-align: center;
  margin-bottom: 28px;
  font-style: italic;
  font-family: "Courier New", Courier, monospace;
`;

const AgeCard = styled.button<{ selected: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 18px;
  margin-bottom: 12px;
  background: ${(props) => (props.selected ? "#ffd700" : "#fffff5")};
  border: 2px solid ${(props) => (props.selected ? "#ffd700" : "#c7bfff")};
  border-radius: 10px;
  cursor: pointer;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.88rem;
  color: ${(props) => (props.selected ? "#1a1a3e" : "#3c3c5c")};
  font-weight: ${(props) => (props.selected ? "bold" : "normal")};
  box-sizing: border-box;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  &:hover {
    border-color: #7c6fcf;
    transform: translateX(3px);
  }
`;

const CardEmoji = styled.span`
  font-size: 1.4rem;
  flex-shrink: 0;
`;

type TSStyledClickd = {
  hasClicked: boolean;
};

export interface IAgePageProps {
  onSendAge: (text: string) => void;
  resetPage: boolean;
}

export default function AgePage({ onSendAge, resetPage }: IAgePageProps) {
  const [hasClicked, setHasClicked] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  function handleAgeSelect(value: string) {
    setSelected(value);
    onSendAge(value);
    setHasClicked(true);
  }

  useEffect(() => {
    if (resetPage) {
      setHasClicked(false);
      setSelected(null);
    }
  }, [resetPage]);

  return (
    <CenterFP>
      <FPDiv hasClicked={hasClicked}>
        <Content hasClicked={hasClicked}>
          <Decoration>📖</Decoration>
          <Prompt>Qual é a sua idade?</Prompt>
          <Hint>a história será adaptada para você</Hint>
          {AGE_OPTIONS.map((opt) => (
            <AgeCard
              key={opt.value}
              selected={selected === opt.value}
              onClick={() => handleAgeSelect(opt.value)}
            >
              <CardEmoji>{opt.emoji}</CardEmoji>
              {opt.label}
            </AgeCard>
          ))}
        </Content>
      </FPDiv>
    </CenterFP>
  );
}
