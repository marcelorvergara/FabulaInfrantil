import { IResult } from "@/interfaces/IResult";
import Image from "next/image";
import { useEffect, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import Modal from "./Modal";
import LoadingSpinner from "./SpinnerAnimation";
import { useTypewriter } from "@/helpers/useTypewriter";

const CenterFP = styled.section`
  width: 95%;
  margin: 1px auto;
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
  z-index: -5;
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

const ProgressBadge = styled.div`
  font-size: 0.65rem;
  color: #aaa;
  text-align: center;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: "Courier New", Courier, monospace;
  padding: 6px 0 2px 0;
`;

const Content = styled.div<TSStyledClickd>`
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
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
  display: block;
  margin: 20px 0 12px 0;
  height: 810px;
  text-align: left;
  padding: 2px;
`;

const Wrapper = styled.div`
  height: auto;
  width: 100%;
  padding: 0px 16px 24px 16px;
  box-sizing: border-box;
`;

const Container = styled.div`
  align-items: flex-start;
`;

const ImageContainer = styled(Image)`
  float: right;
  padding: 4px;
`;

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const ImageSkeleton = styled.div`
  float: right;
  margin: 4px;
  width: 128px;
  height: 128px;
  border-radius: 4px;
  background: linear-gradient(90deg, #d0d0d0 25%, #e8e8e8 50%, #d0d0d0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
`;

const Text = styled.div`
  margin: 0;
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const EndWrapper = styled(Wrapper)`
  animation: ${fadeIn} 0.4s ease forwards;
`;

const ButtonDiv = styled.div<TSStyledClickd>`
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
  width: 100%;
  height: 20%;
  display: flex;
  flex-flow: wrap;
  justify-content: center;
  align-items: center;
  margin-top: 12px;
`;

const Button = styled.button<TSStyledClickd>`
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
  cursor: pointer;
  background: transparent;
  border-radius: 3px;
  border: 2px solid palevioletred;
  color: palevioletred;
  margin: 0 1em;
  padding: 0.25em 1em;
  font-size: 1.2rem;
  width: 80%;
`;

type TSStyledClickd = {
  hasClicked: boolean;
};

export interface ILastPageProps {
  result?: IResult;
  isLoading: boolean;
  isImageLoading: boolean;
  resetPage: boolean;
  image: string;
}

export default function LastPage({
  result,
  isLoading,
  isImageLoading,
  resetPage,
  image,
}: ILastPageProps) {
  const [hasClicked, setHasClicked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayedText, typingDone] = useTypewriter(result?.result?.message?.content ?? "");

  useEffect(() => {
    if (resetPage) {
      setHasClicked(false);
    }
  }, [resetPage]);

  return (
    <CenterFP>
      <FPDiv hasClicked={hasClicked}>
        {isLoading && !hasClicked ? (
          <LoadingSpinner></LoadingSpinner>
        ) : (
          <Content hasClicked={hasClicked}>
            <ProgressBadge>Parte 3 de 3</ProgressBadge>
            <Wrapper>
              <Text>
                {result?.result &&
                  displayedText.split("\n").map((str: string, k: number) => {
                    if (k === 0) {
                      return (
                        <Container key={k}>
                          {isImageLoading ? (
                            <ImageSkeleton />
                          ) : (
                            <ImageContainer
                              src={image}
                              alt="Ilustração da história"
                              width={128}
                              height={128}
                              onClick={() => setIsModalOpen(true)}
                            />
                          )}
                          <Text onClick={() => setHasClicked(true)}>{str}</Text>
                        </Container>
                      );
                    } else {
                      return (
                        <span key={k} onClick={() => setHasClicked(true)}>
                          {str} <br />
                        </span>
                      );
                    }
                  })}
              </Text>
            </Wrapper>
            {typingDone && (
              <EndWrapper>
                <ButtonDiv hasClicked={hasClicked}>
                  <Button
                    hasClicked={hasClicked}
                    onClick={() => setHasClicked(true)}>
                    Ver minha história ✨
                  </Button>
                </ButtonDiv>
              </EndWrapper>
            )}
          </Content>
        )}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)} imageSrc={image} />
        )}
      </FPDiv>
    </CenterFP>
  );
}
