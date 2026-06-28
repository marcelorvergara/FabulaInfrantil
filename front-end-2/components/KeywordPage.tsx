import { IResult } from "@/interfaces/IResult";
import { useEffect, useState } from "react";
import styled, { css } from "styled-components";

const MAX_CHARS = 40;

const SUGGESTIONS = [
  "🦕 Dinossauro",
  "🧜 Sereia",
  "🚀 Astronauta",
  "🐲 Dragão",
  "🧙 Bruxinha",
  "🦊 Raposa",
];

const CenterFP = styled.section`
  width: 95%;
  margin: 6px auto;
`;

const FPDiv = styled.div<TSStyledClickd>`
  height: 870px;
  width: 310px;
  margin-top: 3px;
  padding-right: 6px;
  background-color: #e4e4e4;
  border-radius: 2px 20px 20px 2px;
  transform: rotateX(10deg);
  transform-origin: center left;
  color: darkblue;
  font-size: 1.2rem;
  position: absolute;
  z-index: 7;
  /* the cover only opens once */
  ${(props) => {
    if (props.hasClicked) {
      return css`
        z-index: 9;
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

const InputWrapper = styled.div`
  width: 100%;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  font-size: 15px;
  padding: 12px 14px;
  background: #fffff5;
  border: 2px solid #c7bfff;
  border-radius: 10px;
  color: #3c3c5c;
  outline: none;
  box-sizing: border-box;
  font-family: "Courier New", Courier, monospace;
  transition: border-color 0.2s;
  &:focus {
    border-color: #7c6fcf;
  }
  ::placeholder {
    color: #b0a8d0;
    font-style: italic;
  }
`;

const CharCount = styled.span<{ isNearLimit: boolean }>`
  display: block;
  text-align: right;
  font-size: 0.68rem;
  color: ${(props) => (props.isNearLimit ? "#d94f4f" : "#aaa")};
  margin-bottom: 28px;
  font-family: "Courier New", Courier, monospace;
  transition: color 0.2s;
`;

const Button = styled.button`
  cursor: pointer;
  background: #ffd700;
  border: none;
  border-radius: 50px;
  color: #1a1a3e;
  padding: 12px 36px;
  font-size: 0.92rem;
  font-weight: bold;
  font-family: "Courier New", Courier, monospace;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4);
  transition: transform 0.1s, box-shadow 0.1s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
  }
  &:active {
    transform: translateY(0);
  }
`;

const SuggestionsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 28px;
`;

const Chip = styled.button`
  cursor: pointer;
  background: #f0eeff;
  border: 1.5px solid #c7bfff;
  border-radius: 20px;
  color: #3c3c5c;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-family: "Courier New", Courier, monospace;
  transition: background 0.15s, border-color 0.15s;
  &:hover {
    background: #e0d8ff;
    border-color: #7c6fcf;
  }
`;

const Result = styled.div`
  background-color: red;
  color: white;
`;

const StepsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 20px;
  width: 100%;
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
`;

const StepIcon = styled.span`
  font-size: 1.1rem;
  line-height: 1;
`;

const StepLabel = styled.span`
  font-size: 0.6rem;
  color: #a09ab0;
  font-family: "Courier New", Courier, monospace;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const StepArrow = styled.span`
  font-size: 0.65rem;
  color: #c0b8d8;
  margin-top: -10px;
`;

type TSStyledClickd = {
  hasClicked: boolean;
};

export interface IKeywordPageProps {
  onSendKw: (text: string) => void;
  resetPage: boolean;
  result?: IResult;
  initialKeyword?: string;
}

export default function KeywordPage({
  onSendKw,
  resetPage,
  result,
  initialKeyword,
}: IKeywordPageProps) {
  const [hasClicked, setHasClicked] = useState(false);
  const [kw, setKw] = useState("");

  function handleKwChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.value.length <= MAX_CHARS) {
      setKw(event.target.value);
    }
  }

  function sendBtn() {
    onSendKw(kw);
    setHasClicked(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") sendBtn();
  }

  useEffect(() => {
    if (resetPage) {
      setHasClicked(false);
      setKw("");
    }
  }, [resetPage]);

  useEffect(() => {
    if (initialKeyword) setKw(initialKeyword);
  }, [initialKeyword]);

  return (
    <CenterFP>
      <FPDiv hasClicked={hasClicked}>
        <Content hasClicked={hasClicked}>
          <StepsRow>
            <Step>
              <StepIcon>✨</StepIcon>
              <StepLabel>Tema</StepLabel>
            </Step>
            <StepArrow>›</StepArrow>
            <Step>
              <StepIcon>🦸</StepIcon>
              <StepLabel>Herói</StepLabel>
            </Step>
            <StepArrow>›</StepArrow>
            <Step>
              <StepIcon>📖</StepIcon>
              <StepLabel>Leia</StepLabel>
            </Step>
          </StepsRow>
          <Decoration>✨</Decoration>
          <Prompt>Sobre o que será<br />a sua história?</Prompt>
          <Hint>ex: dinossauro, fada do mar, robô viajante…</Hint>
          <InputWrapper>
            <Input
              id="keyword_select"
              placeholder="uma palavra ou frase"
              value={kw}
              onChange={handleKwChange}
              onKeyDown={handleKeyDown}
            />
          </InputWrapper>
          <CharCount isNearLimit={kw.length >= MAX_CHARS - 5}>
            {kw.length}/{MAX_CHARS}
          </CharCount>
          <SuggestionsGrid>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} onClick={() => setKw(s.replace(/^\S+\s/, ""))}>
                {s}
              </Chip>
            ))}
          </SuggestionsGrid>
          <Button onClick={sendBtn}>Criar história</Button>
          {result?.result && <Result>{result?.result.message.content}</Result>}
        </Content>
      </FPDiv>
    </CenterFP>
  );
}
