import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { sleepStories } from "@/data/sleepStories";
import SleepNarrationPlayer from "@/components/SleepNarrationPlayer";

const CANONICAL_URL = "https://fabulainfantil.com/modo-soninho";
const PAGE_TITLE = "Modo Soninho (beta) — Histórias Narradas para Dormir | Fábula Infantil";
const PAGE_DESCRIPTION =
  "Ouça histórias calmas de ninar, narradas pela voz do seu navegador, com timer de sono. Experimento beta da Fábula Infantil.";

const twinkle = keyframes`
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.85; }
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

const BetaBadge = styled.span`
  display: inline-block;
  background: rgba(255, 215, 0, 0.12);
  border: 1px solid rgba(255, 215, 0, 0.35);
  color: #ffd700;
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: 0.04em;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 14px;
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
  margin: 0 0 8px 0;
  max-width: 480px;
`;

const StoryPicker = styled.section`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  max-width: 640px;
  margin: 0 auto;
  padding: 0 20px 56px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    padding: 0 24px 72px;
  }
`;

const StoryCard = styled.button`
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  font: inherit;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 215, 0, 0.18);
  border-radius: 14px;
  padding: 22px 20px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: rgba(255, 215, 0, 0.4);
    background: rgba(255, 255, 255, 0.07);
  }
`;

const StoryCardTitle = styled.h3`
  color: #ffd700;
  font-size: 1rem;
  margin: 0 0 6px 0;
`;

const StoryCardTeaser = styled.p`
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0 0 10px 0;
`;

const StoryCardMeta = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.78rem;
`;

const FooterNote = styled.p`
  position: relative;
  z-index: 1;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.85rem;
  padding: 0 20px 56px;

  a {
    color: #ffd700;
    text-decoration: underline;
  }
`;

export default function ModoSoninho() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const selectedStory = sleepStories.find((s) => s.slug === selectedSlug) ?? null;

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={CANONICAL_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fábula Infantil" />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={CANONICAL_URL} />
      </Head>

      <Page>
        <NightSky />

        <Hero>
          <Moon />
          <BetaBadge>🧪 beta</BetaBadge>
          <H1>Modo Soninho</H1>
          <Subtitle>
            Histórias calmas, narradas pela voz do seu navegador, para embalar o sono.
          </Subtitle>
        </Hero>

        {!selectedStory ? (
          <StoryPicker>
            {sleepStories.map((story) => (
              <StoryCard key={story.slug} onClick={() => setSelectedSlug(story.slug)}>
                <StoryCardTitle>{story.title}</StoryCardTitle>
                <StoryCardTeaser>{story.teaser}</StoryCardTeaser>
                <StoryCardMeta>{story.estimatedMinutes} min</StoryCardMeta>
              </StoryCard>
            ))}
          </StoryPicker>
        ) : (
          <SleepNarrationPlayer story={selectedStory} onExit={() => setSelectedSlug(null)} />
        )}

        <FooterNote>
          Recurso em teste. Prefere uma história personalizada com o nome do seu filho?{" "}
          <Link href="/historia-para-dormir">Veja aqui</Link>.
        </FooterNote>
      </Page>
    </>
  );
}
