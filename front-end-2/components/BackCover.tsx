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
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  box-sizing: border-box;
`;

const BookTitle = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 20px;
`;

const ButtonRow = styled.div`
  width: 100%;
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
`;

const Button = styled.button`
  cursor: pointer;
  background: transparent;
  border-radius: 3px;
  border: 2px solid palevioletred;
  color: palevioletred;
  padding: 0.25em 1em;
  font-size: 1rem;
  flex: 1;
  font-family: "Courier New", Courier, monospace;
`;

const Divider = styled.hr`
  width: 80%;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  margin: 4px 0 16px 0;
`;

const TokenSection = styled.div`
  width: 100%;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 12px;
  padding: 16px 18px;
  box-sizing: border-box;
  margin-bottom: 16px;
`;

const TokenHeading = styled.p`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 10px;
`;

const CostRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 6px;
`;

const CostDivider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  margin: 8px 0;
`;

const CostTotal = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
`;

const RechargeHeading = styled.p`
  font-size: 13px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin-bottom: 14px;
  padding: 0 4px;
`;

const QrWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const PixKey = styled.p`
  font-size: 12px;
  color: palevioletred;
  letter-spacing: 0.06em;
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
        <BookTitle>Fábula Infantil</BookTitle>

        <ButtonRow>
          <Button onClick={() => onSendReset(true)}>Reiniciar</Button>
          <Button onClick={shareStory}>Compartilhar</Button>
        </ButtonRow>

        <Divider />

        <TokenSection>
          <TokenHeading>custo desta história</TokenHeading>
          <CostRow>
            <span>Texto (IA · ~4k tokens)</span>
            <span>≈ R$0,05</span>
          </CostRow>
          <CostRow>
            <span>3 ilustrações (fal.ai)</span>
            <span>≈ R$0,30</span>
          </CostRow>
          <CostDivider />
          <CostTotal>
            <span>Total consumido</span>
            <span>≈ R$0,35</span>
          </CostTotal>
        </TokenSection>

        <RechargeHeading>
          Tokens ficam mais caros todo mês. Se a história valeu, recarregue o
          balde ✨
        </RechargeHeading>

        <QrWrapper>
          <Image
            src="/qrcode.png"
            alt="QR Code PIX para recarregar tokens"
            width={200}
            height={200}
            priority={true}
          />
          <PixKey>Chave pix: 21 972464530</PixKey>
        </QrWrapper>
      </CoverBack>
    </CenterBook>
  );
}
