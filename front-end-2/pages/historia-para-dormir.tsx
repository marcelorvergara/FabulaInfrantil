import Head from "next/head";
import Link from "next/link";
import styled, { keyframes } from "styled-components";

const CANONICAL_URL = "https://fabulainfantil.com/historia-para-dormir";
const PAGE_TITLE = "História para Dormir Personalizada — Fábula Infantil";
const PAGE_DESCRIPTION =
  "Crie uma história de ninar personalizada para seu filho em 1 minuto, grátis. Com ilustrações e narração por voz, para crianças de 0 a 14 anos.";

const faqData = [
  {
    q: "É grátis?",
    a: "Sim! Criar sua história de ninar personalizada na Fábula Infantil é totalmente gratuito, sem cadastro e sem cartão de crédito.",
  },
  {
    q: "Funciona para qual idade?",
    a: "As histórias são geradas sob medida para crianças de 0 a 14 anos, ajustando vocabulário, ritmo e complexidade para cada faixa etária.",
  },
  {
    q: "Posso ouvir a história narrada?",
    a: "Sim! Cada página conta com um botão de narração por voz, para que seu filho possa ouvir a história sendo contada, mesmo antes de aprender a ler.",
  },
  {
    q: "Posso compartilhar a história?",
    a: "Sim! Depois de pronta, você recebe um link único para reler e compartilhar a história com toda a família, com as ilustrações incluídas.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

function fireGtagEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", eventName, params);
  }
}

const twinkle = keyframes`
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.85; }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const Page = styled.main`
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #0d0d30 0%, #08081f 55%, #030308 100%);
  overflow: hidden;
`;

const SkyLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
`;

const Hero = styled.section`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 56px 20px 40px;
  max-width: 640px;
  margin: 0 auto;

  @media (min-width: 768px) {
    padding: 88px 24px 56px;
  }
`;

const Moon = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 50%;
  margin-bottom: 20px;
  background: #fff8dc;
  box-shadow: -12px 0 0 -6px #0d0d30, 0 0 24px rgba(255, 248, 220, 0.5);
`;

const H1 = styled.h1`
  font-family: Arial, sans-serif;
  color: #ffd700;
  font-size: clamp(1.6rem, 5vw, 2.4rem);
  line-height: 1.25;
  margin: 0 0 14px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.85);
  font-size: clamp(1rem, 3vw, 1.2rem);
  margin: 0 0 32px 0;
  max-width: 480px;
`;

const CTALink = styled(Link)`
  display: inline-block;
  padding: 14px 32px;
  background: #ffd700;
  color: #1a1a3e;
  border-radius: 50px;
  font-weight: bold;
  font-size: 1.05rem;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.45);
  animation: ${bounce} 2.4s ease-in-out infinite;
  transition: transform 0.15s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const SecondaryCTALink = styled(Link)`
  display: inline-block;
  margin-top: 14px;
  padding: 10px 22px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.85rem;
  text-decoration: none;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
    color: #ffd700;
  }
`;

const Benefits = styled.section`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px 56px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    padding: 0 24px 72px;
  }
`;

const BenefitCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 215, 0, 0.18);
  border-radius: 14px;
  padding: 22px 20px;
  text-align: center;
`;

const BenefitIcon = styled.div`
  font-size: 1.8rem;
  margin-bottom: 10px;
`;

const BenefitTitle = styled.h3`
  color: #ffd700;
  font-size: 1rem;
  margin: 0 0 6px 0;
`;

const BenefitText = styled.p`
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
`;

const ContentSection = styled.section`
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px 56px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.7;
  font-size: 0.95rem;

  @media (min-width: 768px) {
    padding: 0 24px 72px;
  }
`;

const SectionTitle = styled.h2`
  color: #ffd700;
  font-family: Arial, sans-serif;
  font-size: clamp(1.2rem, 3.5vw, 1.5rem);
  margin: 0 0 18px 0;
  text-align: center;
`;

const SectionParagraph = styled.p`
  margin: 0 0 16px 0;
`;

const FaqSection = styled.section`
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px 64px;

  @media (min-width: 768px) {
    padding: 0 24px 88px;
  }
`;

const FaqItem = styled.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 18px 0;

  &:first-child {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const FaqQuestion = styled.h3`
  color: #ffffff;
  font-size: 1rem;
  margin: 0 0 8px 0;
`;

const FaqAnswer = styled.p`
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
`;

const BottomCTAWrap = styled.section`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding: 0 20px 72px;
`;

const Star = styled.div<{ $top: string; $left: string; $size: number; $duration: number; $delay: string }>`
  position: absolute;
  top: ${(props) => props.$top};
  left: ${(props) => props.$left};
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  border-radius: 50%;
  background: #ffffff;
  animation: ${twinkle} ${(props) => props.$duration}s ease-in-out infinite;
  animation-delay: ${(props) => props.$delay};
`;

function NightSky() {
  const stars = [
    { top: "8%", left: "12%", size: 2, delay: "0s" },
    { top: "16%", left: "82%", size: 2.4, delay: "0.6s" },
    { top: "28%", left: "6%", size: 1.6, delay: "1.1s" },
    { top: "10%", left: "48%", size: 1.8, delay: "1.6s" },
    { top: "34%", left: "90%", size: 2, delay: "0.3s" },
    { top: "22%", left: "62%", size: 1.5, delay: "2s" },
    { top: "4%", left: "70%", size: 1.6, delay: "0.9s" },
    { top: "38%", left: "30%", size: 1.4, delay: "1.4s" },
  ];

  return (
    <SkyLayer aria-hidden="true">
      {stars.map((star, i) => (
        <Star
          key={i}
          $top={star.top}
          $left={star.left}
          $size={star.size}
          $duration={3 + i * 0.4}
          $delay={star.delay}
        />
      ))}
    </SkyLayer>
  );
}

export default function HistoriaParaDormir() {
  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={CANONICAL_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fábula Infantil" />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={CANONICAL_URL} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </Head>

      <Page>
        <NightSky />

        <Hero>
          <Moon />
          <H1>História para dormir personalizada para seu filho</H1>
          <Subtitle>
            Crie uma história de ninar única em 1 minuto — grátis
          </Subtitle>
          <CTALink href="/?keyword=sono">Criar história de ninar ✨</CTALink>
          <SecondaryCTALink
            href="/modo-soninho"
            onClick={() => fireGtagEvent("sleep_mode_clicked")}
          >
            🧪 Experimente o Modo Soninho (beta)
          </SecondaryCTALink>
        </Hero>

        <Benefits>
          <BenefitCard>
            <BenefitIcon>👶</BenefitIcon>
            <BenefitTitle>Personalizada</BenefitTitle>
            <BenefitText>
              A história é criada com o nome da criança como protagonista da
              própria aventura.
            </BenefitText>
          </BenefitCard>
          <BenefitCard>
            <BenefitIcon>🎂</BenefitIcon>
            <BenefitTitle>Adequada à idade</BenefitTitle>
            <BenefitText>
              Linguagem e complexidade ajustadas para crianças de 0 a 14
              anos.
            </BenefitText>
          </BenefitCard>
          <BenefitCard>
            <BenefitIcon>🔊</BenefitIcon>
            <BenefitTitle>Ilustrações e narração por voz</BenefitTitle>
            <BenefitText>
              Cada página ganha uma ilustração única e pode ser ouvida em voz
              alta.
            </BenefitText>
          </BenefitCard>
        </Benefits>

        <ContentSection>
          <SectionTitle>
            Por que a hora de dormir merece uma história especial
          </SectionTitle>
          <SectionParagraph>
            A hora de dormir é um dos momentos mais importantes do dia para o
            desenvolvimento infantil. Rotinas consistentes antes de dormir
            ajudam a criança a relaxar, reduzem a ansiedade e sinalizam ao
            cérebro que é hora de descansar. Crianças com rotinas de sono bem
            estabelecidas costumam dormir mais cedo, acordam menos durante a
            noite e apresentam melhor regulação emocional durante o dia.
          </SectionParagraph>
          <SectionParagraph>
            Contar uma história antes de dormir é uma das formas mais
            eficazes de criar esse ritual. Além de fortalecer o vínculo entre
            pais e filhos, a leitura noturna estimula a imaginação, amplia o
            vocabulário e ajuda a criança a processar as emoções do dia. Mas
            nem sempre é fácil encontrar uma história nova todas as noites —
            e histórias repetidas podem perder a magia com o tempo.
          </SectionParagraph>
          <SectionParagraph>
            É aí que entra a personalização. Quando a criança é a
            protagonista da própria aventura — com o nome dela e uma trama
            pensada para a sua idade — o envolvimento é imediato. A Fábula
            Infantil usa inteligência artificial para criar, em cerca de um
            minuto, uma história de ninar única, com ilustrações e narração
            por voz, adaptada para crianças de 0 a 14 anos.
          </SectionParagraph>
          <SectionParagraph>
            Diferente de livros prontos, cada história é gerada na hora, a
            partir de uma palavra-chave escolhida pelos pais ou pela própria
            criança. O resultado é uma narrativa calma, com final
            tranquilizador, ideal para encerrar o dia com leveza — sem
            esforço para os pais e sem custo algum.
          </SectionParagraph>
        </ContentSection>

        <FaqSection>
          <SectionTitle>Perguntas frequentes</SectionTitle>
          {faqData.map((item) => (
            <FaqItem key={item.q}>
              <FaqQuestion>{item.q}</FaqQuestion>
              <FaqAnswer>{item.a}</FaqAnswer>
            </FaqItem>
          ))}
        </FaqSection>

        <BottomCTAWrap>
          <CTALink href="/?keyword=sono">Criar história de ninar ✨</CTALink>
        </BottomCTAWrap>
      </Page>
    </>
  );
}
