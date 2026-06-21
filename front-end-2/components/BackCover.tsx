import styled from "styled-components";
import Image from "next/image";

const CenterBook = styled.section`
  width: 95%;
  margin: 2px auto;
`;

const CoverBack = styled.div`
  height: 880px;
  width: 325px;
  background-color: #46485a;
  border-radius: 2px 20px 20px 2px;
  box-shadow: 1px 1px 10px gray;
  transform: rotateX(10deg);
  transform-origin: center left;
  color: white;
  font-size: 2.5rem;
  position: absolute;
  z-index: -6;
`;

const Content = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 150px;
  font-size: 16px;
`;

const ButtonDiv = styled.div`
  width: 100%;
  height: 20%;
  display: flex;
  flex-flow: wrap;
  justify-content: center;
  align-items: center;
`;

const Button = styled.button`
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

const QrCode = styled.div`
  display: flex;
  flex-flow: wrap;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 24px;
`;

const Apio = styled.div`
  color: palevioletred;
  font-size: 14px;
  padding: 10px;
  margin: 12px;
  text-align: center;
`;
export interface IBackCoverProps {
  onSendReset: (cond: boolean) => void;
  shareStory: () => void;
}

export default function BackCover({
  onSendReset,
  shareStory,
}: IBackCoverProps) {
  return (
    <CenterBook>
      <CoverBack>
        <Content>Fabula Infantil</Content>
        <ButtonDiv>
          <Button onClick={() => onSendReset(true)}>Reiniciar</Button>
          <Button onClick={shareStory}>Compartilhar</Button>
        </ButtonDiv>
        <QrCode>
          <Apio>
            Apoie nosso aplicativo e nos ajude a continuar contando histórias
            incríveis!
          </Apio>
          <Image
            src="/qrcode.png"
            alt="qrcode"
            width={257}
            height={256}
            priority={true}
          />
          <Apio>Chave pix: 21 972464530</Apio>
        </QrCode>
      </CoverBack>
    </CenterBook>
  );
}
