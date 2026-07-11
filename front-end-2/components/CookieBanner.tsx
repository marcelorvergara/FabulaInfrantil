import styled from "styled-components";

const Banner = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: #0d0d3b;
  border-top: 2px solid #4a4aff;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: "Courier New", Courier, monospace;
  color: #e0e0ff;
  font-size: 13px;
  flex-wrap: wrap;
`;

const Text = styled.p`
  margin: 0;
  flex: 1;
  min-width: 200px;
  line-height: 1.5;
`;

const Buttons = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const Btn = styled.button<{ $primary?: boolean }>`
  padding: 7px 18px;
  border-radius: 6px;
  border: 1.5px solid #4a4aff;
  cursor: pointer;
  font-family: "Courier New", Courier, monospace;
  font-size: 13px;
  font-weight: bold;
  background: ${(p) => (p.$primary ? "#4a4aff" : "transparent")};
  color: ${(p) => (p.$primary ? "#fff" : "#a0a0ff")};
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.8;
  }
`;

interface Props {
  onConsent: (accepted: boolean) => void;
}

export default function CookieBanner({ onConsent }: Props) {
  return (
    <Banner role="region" aria-label="Aviso de cookies">
      <Text>
        Por padrão, medimos visitas de forma anônima e sem cookies. Ao
        aceitar, habilitamos cookies para métricas de anúncios e
        personalização.
      </Text>
      <Buttons>
        <Btn onClick={() => onConsent(false)}>Recusar</Btn>
        <Btn $primary onClick={() => onConsent(true)}>
          Aceitar
        </Btn>
      </Buttons>
    </Banner>
  );
}
