import { useEffect, useState } from "react";
import styled, { css } from "styled-components";

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
  display: block;
  margin: 40px 0 12px 0;
  height: 840px;
  text-align: left;
  padding: 12px;
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

const AgeQuestion = styled.div`
  padding: 12px;
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

  function handleAge(age: string) {
    onSendAge(age);
  }
  function handleAgeChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleAge(event.target.value);
    setHasClicked(true);
  }

  useEffect(() => {
    if (resetPage) {
      setHasClicked(false);
      // Clear all radio buttons
      const radioButtons = document.getElementsByName("radio");
      radioButtons.forEach((button) => {
        (button as HTMLInputElement).checked = false;
      });
    }
  }, [resetPage]);

  return (
    <CenterFP>
      <FPDiv hasClicked={hasClicked}>
        <Content hasClicked={hasClicked}>
          <AgeQuestion>Qual a sua idade?</AgeQuestion>
          <Wrapper>
            <Item>
              <RadioButton
                type="radio"
                name="radio"
                value="0_3"
                id="0_3"
                onChange={(event) => handleAgeChange(event)}
              />
              <RadioButtonLabel />
              <label htmlFor="0_3">Entre 0 e 3 anos</label>
            </Item>
            <Item>
              <RadioButton
                type="radio"
                name="radio"
                value="4_7"
                id="4_7"
                onChange={(event) => handleAgeChange(event)}
              />
              <RadioButtonLabel />
              <label htmlFor="4_7">Entre 4 e 7 anos</label>
            </Item>
            <Item>
              <RadioButton
                type="radio"
                name="radio"
                value="8_11"
                id="8_11"
                onChange={(event) => handleAgeChange(event)}
              />
              <RadioButtonLabel />
              <label htmlFor="8_11">Entre 8 e 11 anos</label>
            </Item>
            <Item>
              <RadioButton
                type="radio"
                name="radio"
                value="12_14"
                id="12_14"
                onChange={(event) => handleAgeChange(event)}
              />
              <RadioButtonLabel />
              <label htmlFor="12_14">Entre 12 e 14 anos</label>
            </Item>
          </Wrapper>
        </Content>
      </FPDiv>
    </CenterFP>
  );
}
