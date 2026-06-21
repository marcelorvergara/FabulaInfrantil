import { useEffect, useState } from "react";
import styled, { css } from "styled-components";

const MAX_CHARS = 30;

const CenterFP = styled.section`
  width: 95%;
  margin: 6px auto;
`;

const FPDiv = styled.div<{ hasClicked: boolean }>`
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
  z-index: -3;
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

const Content = styled.div<{ hasClicked: boolean }>`
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
  margin-bottom: 24px;
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
  margin-bottom: 20px;
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
  margin-bottom: 14px;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
  }
  &:active {
    transform: translateY(0);
  }
`;

const SkipButton = styled.button`
  cursor: pointer;
  background: transparent;
  border: none;
  color: #aaa;
  font-size: 0.78rem;
  font-family: "Courier New", Courier, monospace;
  text-decoration: underline;
  padding: 4px 8px;
  transition: color 0.15s;
  &:hover {
    color: #7c6fcf;
  }
`;

export interface IHeroPageProps {
  onSendHero: (name: string) => void;
  resetPage: boolean;
}

export default function HeroPage({ onSendHero, resetPage }: IHeroPageProps) {
  const [hasClicked, setHasClicked] = useState(false);
  const [name, setName] = useState("");

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.value.length <= MAX_CHARS) {
      setName(event.target.value);
    }
  }

  function handleContinue() {
    onSendHero(name.trim());
    setHasClicked(true);
  }

  function handleSkip() {
    onSendHero("");
    setHasClicked(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") handleContinue();
  }

  useEffect(() => {
    if (resetPage) {
      setHasClicked(false);
      setName("");
    }
  }, [resetPage]);

  return (
    <CenterFP>
      <FPDiv hasClicked={hasClicked}>
        <Content hasClicked={hasClicked}>
          <Decoration>🦸</Decoration>
          <Prompt>
            Como se chama<br />o herói da história?
          </Prompt>
          <Hint>deixe em branco para o herói não ter nome</Hint>
          <InputWrapper>
            <Input
              placeholder="ex: Luna, Pedro, Zara…"
              value={name}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              autoFocus={false}
            />
          </InputWrapper>
          <CharCount isNearLimit={name.length >= MAX_CHARS - 5}>
            {name.length}/{MAX_CHARS}
          </CharCount>
          <Button onClick={handleContinue}>Continuar</Button>
          <SkipButton onClick={handleSkip}>pular esta etapa</SkipButton>
        </Content>
      </FPDiv>
    </CenterFP>
  );
}
