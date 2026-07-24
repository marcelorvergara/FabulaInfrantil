import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import styled, { keyframes } from "styled-components";
import { ISharedStory } from "@/interfaces/ISharedStory";

const PAGE_DESCRIPTION_TEMPLATE = (title: string) =>
  `Leia "${title}", uma história infantil personalizada criada com Fábula Infantil.`;

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

const Star = styled.div<{
  $top: string;
  $left: string;
  $size: number;
  $duration: number;
  $delay: string;
}>`
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
  padding: 48px 20px 24px;
  max-width: 720px;
  margin: 0 auto;

  @media (min-width: 768px) {
    padding: 72px 24px 32px;
  }
`;

const H1 = styled.h1`
  font-family: Arial, sans-serif;
  color: #ffd700;
  font-size: clamp(1.6rem, 5vw, 2.4rem);
  line-height: 1.25;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  margin: 0;
`;

const StoryBody = styled.article`
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px 56px;

  @media (min-width: 768px) {
    padding: 0 24px 72px;
  }
`;

const ParagraphBlock = styled.section`
  margin-bottom: 40px;
`;

const ImageWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 215, 0, 0.18);
`;

const ParagraphText = styled.p`
  color: rgba(255, 255, 255, 0.85);
  font-size: 1.05rem;
  line-height: 1.75;
  margin: 0;
  white-space: pre-wrap;
`;

const BottomCTAWrap = styled.section`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding: 0 20px 72px;
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
  transition: transform 0.15s;

  &:hover {
    transform: translateY(-2px);
  }
`;

interface Props {
  story: ISharedStory;
  storyId: string;
}

export default function SharedStoryPage({ story, storyId }: Props) {
  const canonicalUrl = `https://fabulainfantil.com/historias/${storyId}`;
  const description = PAGE_DESCRIPTION_TEMPLATE(story.title);
  const ogImage = story.images.find((img) => img !== null) || undefined;

  return (
    <>
      <Head>
        <title>{story.title} — Fábula Infantil</title>
        <meta name="description" content={description} />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Fábula Infantil" />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:title" content={story.title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        {ogImage && <meta property="og:image" content={ogImage} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={story.title} />
        <meta name="twitter:description" content={description} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
      </Head>

      <Page>
        <NightSky />

        <Hero>
          <H1>{story.title}</H1>
          <Subtitle>Uma história criada com Fábula Infantil</Subtitle>
        </Hero>

        <StoryBody>
          {story.paragraphs.map((paragraph, i) => (
            <ParagraphBlock key={i}>
              {story.images[i] && (
                <ImageWrap>
                  <Image
                    src={story.images[i] as string}
                    alt={`Ilustração ${i + 1} de ${story.title}`}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(min-width: 768px) 720px, 100vw"
                    priority={i === 0}
                  />
                </ImageWrap>
              )}
              <ParagraphText>{paragraph}</ParagraphText>
            </ParagraphBlock>
          ))}
        </StoryBody>

        <BottomCTAWrap>
          <CTALink href="/">Criar sua própria história ✨</CTALink>
        </BottomCTAWrap>
      </Page>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const storyId = context.params?.storyId as string;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_SRV}/shareStory/${storyId}/data`
  );

  if (!response.ok) {
    return { notFound: true };
  }

  const story: ISharedStory = await response.json();

  return { props: { story, storyId } };
};
