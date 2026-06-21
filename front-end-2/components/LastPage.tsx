import { IResult } from "@/interfaces/IResult";
import Image from "next/image";
import { useEffect, useState } from "react";
import styled, { css } from "styled-components";
import Modal from "./Modal";
import LoadingSpinner from "./SpinnerAnimation";

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
  /* the cover only opens once */
  ${(props) => {
    if (props.hasClicked) {
      gtag("event", "last_page", { go_to: "all_to_back_cover" });
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
  overflow-y: auto;
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

const Text = styled.div`
  margin: 0;
`;

const ButtonDiv = styled.div<TSStyledClickd>`
  ${(props) => {
    if (props.hasClicked) {
      gtag("event", "last_page", { go_to: "button_back_cover" });
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
  resetPage: boolean;
  image: string;
}

export default function LastPage({
  result,
  isLoading,
  resetPage,
  image,
}: ILastPageProps) {
  const [hasClicked, setHasClicked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            <Wrapper>
              <Text>
                {result?.result &&
                  result?.result.message.content.split("\n").map((str, k) => {
                    if (k === 0) {
                      return (
                        <Container key={k}>
                          <ImageContainer
                            src={image}
                            alt="Aqui deveria ter uma imagem"
                            width={128}
                            height={128}
                            onClick={() => setIsModalOpen(true)}
                          />
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
              <ButtonDiv hasClicked={hasClicked}>
                <Button
                  hasClicked={hasClicked}
                  onClick={() => setHasClicked(true)}>
                  Fim
                </Button>
              </ButtonDiv>
            </Wrapper>
          </Content>
        )}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)} imageSrc={image} />
        )}
      </FPDiv>
    </CenterFP>
  );
}
