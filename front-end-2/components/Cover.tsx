import { useEffect, useState } from "react";
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
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    visibility: hidden;
  }
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

type TSStyledCoverBack = {
  hasHovered?: boolean;
};

type TSStyledCoverDisplay = {
  display?: string;
};

export default function Book() {
  const [hasHovered, setHasHovered] = useState(false);

  useEffect(() => {
    const handleMouseOver = () => {
      setHasHovered(true);
    };

    if (!hasHovered) {
      const cover = document.getElementById("cover");
      if (cover) {
        cover.addEventListener("mouseover", handleMouseOver);
      }
    }

    return () => {
      const cover = document.getElementById("cover");
      if (cover) {
        cover.removeEventListener("mouseover", handleMouseOver);
      }
    };
  }, [hasHovered]);

  return (
    <CenterBook id="cover">
      <CoverBack hasHovered={hasHovered}>
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
        </Content>
      </CoverBack>
    </CenterBook>
  );
}
