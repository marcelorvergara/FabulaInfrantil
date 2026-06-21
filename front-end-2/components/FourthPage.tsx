import { IResult } from "@/interfaces/IResult";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import Modal from "./Modal";
import LoadingSpinner from "./SpinnerAnimation";
import { useTypewriter } from "@/helpers/useTypewriter";

function parseStoryAndOptions(text: string): { storyText: string; options: string[] } {
  const match = text.match(/\nOpção 1/);
  if (!match || match.index === undefined) return { storyText: text, options: [] };
  const storyText = text.slice(0, match.index).trim();
  const optionsBlock = text.slice(match.index);
  const options: string[] = [];
  const optionRegex = /Opção \d+[:.]\s*(.+)/g;
  let m;
  while ((m = optionRegex.exec(optionsBlock)) !== null) {
    options.push(m[1].trim());
  }
  return { storyText, options };
}

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

const ItemLabel = styled.label<{ isSelected: boolean }>`
  display: flex;
  align-items: center;
  height: 48px;
  position: relative;
  border: 1px solid ${(props) => (props.isSelected ? "palevioletred" : "#ccc")};
  box-sizing: border-box;
  border-radius: 2px;
  margin-bottom: 10px;
  margin-top: 16px;
  cursor: pointer;
  background: ${(props) => (props.isSelected ? "#fce4ec" : "transparent")};
  transition: background 0.15s, border-color 0.15s;
`;

const RadioButtonIndicator = styled.span`
  position: absolute;
  top: 25%;
  left: 4px;
  width: 20px;
  height: 20px;
  border-radius: 20%;
  background: white;
  border: 1px solid #ccc;
  pointer-events: none;
`;

const RadioButton = styled.input`
  opacity: 0;
  z-index: 1;
  cursor: pointer;
  width: 25px;
  height: 25px;
  margin-right: 10px;
  flex-shrink: 0;
  &:checked + ${RadioButtonIndicator} {
    background: palevioletred;
    border: 1px solid palevioletred;
  }
`;

const OptionText = styled.span`
  font-size: 0.9rem;
  padding-left: 4px;
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

const OptionsWrapper = styled(Wrapper)`
  animation: ${fadeIn} 0.4s ease forwards;
`;

type TSStyledClickd = {
  hasClicked: boolean;
};

export interface IFourthPageProps {
  onSendOption: (text: string) => void;
  result?: IResult;
  isLoading: boolean;
  isImageLoading: boolean;
  resetPage: boolean;
  image: string;
}

export default function FourthPage({
  onSendOption,
  result,
  isLoading,
  isImageLoading,
  resetPage,
  image,
}: IFourthPageProps) {
  const [hasClicked, setHasClicked] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fullContent = result?.result?.message?.content ?? "";
  const [displayedText, typingDone] = useTypewriter(fullContent);

  const { storyText, parsedOptions } = useMemo(() => {
    if (!typingDone) return { storyText: "", parsedOptions: [] as string[] };
    const { storyText, options } = parseStoryAndOptions(fullContent);
    return { storyText, parsedOptions: options };
  }, [typingDone, fullContent]);

  const textToRender = typingDone ? storyText : displayedText;

  const optionItems =
    parsedOptions.length >= 3
      ? parsedOptions.slice(0, 3).map((text, i) => ({
          id: `fourth_page_${i + 1}`,
          value: text,
          label: text,
        }))
      : [
          { id: "fourth_page_1", value: "1", label: "Opção 1" },
          { id: "fourth_page_2", value: "2", label: "Opção 2" },
          { id: "fourth_page_3", value: "3", label: "Opção 3" },
        ];

  function handleOptionChange(event: React.ChangeEvent<HTMLInputElement>) {
    const val = event.target.value;
    setSelectedValue(val);
    setTimeout(() => {
      onSendOption(val);
      setHasClicked(true);
    }, 300);
  }

  useEffect(() => {
    if (resetPage) {
      setHasClicked(false);
      setSelectedValue(null);
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
                  textToRender.split("\n").map((str: string, k: number) => {
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
            {typingDone && (
              <OptionsWrapper>
                {optionItems.map(({ id, value, label }) => (
                  <ItemLabel key={id} htmlFor={id} isSelected={selectedValue === value}>
                    <RadioButton
                      type="radio"
                      name="radio"
                      value={value}
                      id={id}
                      onChange={handleOptionChange}
                    />
                    <RadioButtonIndicator />
                    <OptionText>{label}</OptionText>
                  </ItemLabel>
                ))}
              </OptionsWrapper>
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
