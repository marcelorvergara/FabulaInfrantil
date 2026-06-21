import { IResult } from "@/interfaces/IResult";
import { useEffect, useState } from "react";
import styled, { css } from "styled-components";

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
  text-align: right;
`;

const Input = styled.input`
  width: 80%;
  font-size: 18px;
  padding: 10px;
  margin: 96px 12px 12px 12px;
  background: papayawhip;
  border: none;
  border-radius: 3px;
  ::placeholder {
    color: palevioletred;
  }
`;

const Button = styled.button`
  cursor: pointer;
  background: transparent;
  border-radius: 3px;
  border: 2px solid palevioletred;
  color: palevioletred;
  margin: 10px 1em;
  padding: 0.55em 1.9em;
  margin-bottom: 12px;
`;

const Result = styled.div`
  background-color: red;
  color: white;
`;

type TSStyledClickd = {
  hasClicked: boolean;
};

export interface IKeywordPageProps {
  onSendKw: (text: string) => void;
  resetPage: boolean;
  result?: IResult;
}

export default function KeywordPage({
  onSendKw,
  resetPage,
  result,
}: IKeywordPageProps) {
  const [hasClicked, setHasClicked] = useState(false);
  // keyword
  const [kw, setKw] = useState("");

  function handleKeyword() {
    onSendKw(kw);
  }
  function handleKwChange(event: React.ChangeEvent<HTMLInputElement>) {
    setKw(event.target.value);
  }

  function sendBtn() {
    handleKeyword();
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
        <Content hasClicked={hasClicked}>
          <Input
            id="keyord_select"
            placeholder="digite aqui uma palavra"
            onChange={handleKwChange}></Input>
          <Button onClick={sendBtn}>Enviar</Button>
          {result?.result && <Result>{result?.result.message.content}</Result>}
        </Content>
      </FPDiv>
    </CenterFP>
  );
}
