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
  z-index: -4;
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

const Item = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  position: relative;
  border: 1px solid #ccc;
  box-sizing: border-box;
  border-radius: 2px;
  margin-bottom: 10px;
  margin-top: 16px;
`;

const RadioButtonLabel = styled.label`
  position: absolute;
  top: 25%;
  left: 4px;
  width: 20px;
  height: 20px;
  border-radius: 20%;
  background: white;
  border: 1px solid #ccc;
`;
const RadioButton = styled.input`
  opacity: 0;
  z-index: 1;
  cursor: pointer;
  width: 25px;
  height: 25px;
  margin-right: 10px;
  &:hover ~ ${RadioButtonLabel} {
    background: palevioletred;
    &::after {
      display: block;
      color: white;
      width: 12px;
      height: 12px;
      margin: 4px;
    }
  }
  &:checked + ${Item} {
    background: palevioletred;
    border: 2px solid palevioletred;
  }
  &:checked + ${RadioButtonLabel} {
    background: palevioletred;
    border: 1px solid palevioletred;
    &::after {
      display: block;
      color: white;
      width: 12px;
      height: 12px;
      margin: 4px;
    }
  }
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

type TSStyledClickd = {
  hasClicked: boolean;
};

export interface IFourthPageProps {
  onSendOption: (text: string) => void;
  result?: IResult;
  isLoading: boolean;
  resetPage: boolean;
  image: string;
}

export default function FourthPage({
  onSendOption,
  result,
  isLoading,
  resetPage,
  image,
}: IFourthPageProps) {
  const [hasClicked, setHasClicked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleOption(opt: string) {
    onSendOption(opt);
  }
  function handleOptionChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleOption(event.target.value);
    setHasClicked(true);
  }

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
                          <Text>{str}</Text>
                        </Container>
                      );
                    } else {
                      return (
                        <span key={k}>
                          {str} <br />
                        </span>
                      );
                    }
                  })}
              </Text>
            </Wrapper>
            <Wrapper>
              <Item>
                <RadioButton
                  type="radio"
                  name="radio"
                  value="1"
                  id="fourth_page_1"
                  onChange={(event) => handleOptionChange(event)}
                />
                <RadioButtonLabel />
                <label htmlFor="fourth_page_1">Opção 1</label>
              </Item>
              <Item>
                <RadioButton
                  type="radio"
                  name="radio"
                  value="2"
                  id="fourth_page_2"
                  onChange={(event) => handleOptionChange(event)}
                />
                <RadioButtonLabel />
                <label htmlFor="fourth_page_2">Opção 2</label>
              </Item>
              <Item>
                <RadioButton
                  type="radio"
                  name="radio"
                  value="3"
                  id="fourth_page_3"
                  onChange={(event) => handleOptionChange(event)}
                />
                <RadioButtonLabel />
                <label htmlFor="fourth_page_3">Opção 3</label>
              </Item>
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
