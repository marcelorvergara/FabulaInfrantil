import { useState } from "react";
import styled, { css, keyframes } from "styled-components";

const CenterBook = styled.section`
  width: 95%;
  margin: 10px auto;
`;

const CoverBack = styled.div<TSStyledCoverBack>`
  cursor: pointer;
  height: 880px;
  width: 320px;
  background-image: linear-gradient(to top, #3c3c5c, #495a83, #49758a);
  border-radius: 2px 20px 20px 2px;
  box-shadow: 1px 1px 10px gray;
  transform: rotateX(10deg);
  transform-origin: center left;
  ${(props) => {
    if (props.hasHovered) {
      return css`
        transform: rotateX(10deg) rotateY(-180deg);
        transition-duration: 3s;
      `;
    }
    return "";
  }}
  color: white;
  font-size: 1.8rem;
  position: absolute;
  z-index: 1;
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; visibility: hidden; }
`;

const Content = styled.div<TSStyledCoverBack>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 14px;
  padding: 48px;
  ${(props) => {
    if (props.hasHovered) {
      return css`
        animation: ${fadeOut} 2s linear;
        animation-fill-mode: forwards;
      `;
    }
    return "";
  }}
`;

const Title = styled.h1`
  font-family: "Arial", sans-serif;
  font-size: 2.5rem;
  font-weight: bold;
  text-transform: uppercase;
  text-align: center;
  margin: 0 0 16px 0;
  color: #ffd700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
`;

const Subtitle = styled.h2<TSStyledCoverDisplay>`
  font-family: "Arial", sans-serif;
  font-size: 1.5rem;
  font-weight: normal;
  text-align: center;
  margin: 0 0 8px 0;
  color: #ffffff;
  ${(props) => {
    if (props.display !== "true") {
      return css`
        display: none;
      `;
    }
    return "";
  }}
`;

const Author = styled.h3<TSStyledCoverDisplay>`
  font-family: "Arial", sans-serif;
  font-size: 1.2rem;
  font-weight: normal;
  text-align: center;
  margin: 0 0 4px 0;
  color: #ffffff;
  ${(props) => {
    if (props.display !== "true") {
      return css`
        display: none;
      `;
    }
    return "";
  }}
`;

const bounceAnim = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const CTAButton = styled.button`
  margin-top: 48px;
  padding: 14px 32px;
  background: #ffd700;
  color: #1a1a3e;
  border: none;
  border-radius: 50px;
  font-size: 1.05rem;
  font-weight: bold;
  cursor: pointer;
  animation: ${bounceAnim} 2s ease-in-out infinite;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.45);
  font-family: "Courier New", Courier, monospace;
  white-space: nowrap;
`;

const StarsWrapper = styled.div<TSStyledCoverBack>`
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
  ${(props) =>
    props.hasHovered &&
    css`
      animation: ${fadeOut} 1.5s linear;
      animation-fill-mode: forwards;
    `}
`;

const Teaser = styled.p<TSStyledCoverBack>`
  position: absolute;
  bottom: 24px;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  pointer-events: none;
  ${(props) =>
    props.hasHovered &&
    css`
      animation: ${fadeOut} 1s linear;
      animation-fill-mode: forwards;
    `}
`;

type TSStyledCoverBack = {
  hasHovered?: boolean;
};

type TSStyledCoverDisplay = {
  display?: string;
};

function WhimsicalSVG() {
  return (
    <svg
      width="260"
      height="200"
      viewBox="0 0 260 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id="crescent">
          <circle cx="130" cy="60" r="38" fill="white" />
          <circle cx="148" cy="53" r="30" fill="black" />
        </mask>
      </defs>
      <circle
        cx="130"
        cy="60"
        r="38"
        fill="white"
        opacity="0.85"
        mask="url(#crescent)"
      />
      {/* Large 4-pointed star — left */}
      <path
        d="M55 130 L58 145 L73 148 L58 151 L55 166 L52 151 L37 148 L52 145 Z"
        fill="white"
        opacity="0.8"
      />
      {/* Medium 4-pointed star — right */}
      <path
        d="M205 110 L207.5 122 L220 124.5 L207.5 127 L205 139 L202.5 127 L190 124.5 L202.5 122 Z"
        fill="white"
        opacity="0.75"
      />
      {/* Small 4-pointed star — top right */}
      <path
        d="M215 40 L216.5 48 L225 49.5 L216.5 51 L215 59 L213.5 51 L205 49.5 L213.5 48 Z"
        fill="white"
        opacity="0.6"
      />
      {/* Sparkle dots */}
      <circle cx="35" cy="90" r="2.5" fill="white" opacity="0.5" />
      <circle cx="230" cy="170" r="2" fill="white" opacity="0.45" />
      <circle cx="100" cy="180" r="1.8" fill="white" opacity="0.4" />
      <circle cx="175" cy="175" r="1.5" fill="white" opacity="0.35" />
      <circle cx="45" cy="170" r="1.5" fill="white" opacity="0.4" />
      <circle cx="240" cy="80" r="2" fill="white" opacity="0.4" />
    </svg>
  );
}

export default function Book() {
  const [hasHovered, setHasHovered] = useState(false);

  const handleFlip = () => {
    if (!hasHovered) setHasHovered(true);
  };

  return (
    <CenterBook id="cover">
      <CoverBack hasHovered={hasHovered} onClick={handleFlip}>
        <Content hasHovered={hasHovered}>
          <Title>Fábula Infantil</Title>
          <Subtitle display={"true"}>Histórias Criadas por Você</Subtitle>
          <Author display={"true"}>Aventuras únicas e memoráveis</Author>
          <Subtitle display={"false"}>Estimule a Imaginação</Subtitle>
          <Author display={"false"}>
            Com ajuda de inteligência artificial
          </Author>
          <Subtitle display={"false"}>Histórias e fábulas</Subtitle>
          <Author display={"false"}>Para crianças de 0 a 14 anos</Author>
          <CTAButton onClick={handleFlip}>Criar minha história ✨</CTAButton>
        </Content>
        <StarsWrapper hasHovered={hasHovered}>
          <WhimsicalSVG />
        </StarsWrapper>
        <Teaser hasHovered={hasHovered}>3 passos para criar sua história</Teaser>
      </CoverBack>
    </CenterBook>
  );
}
