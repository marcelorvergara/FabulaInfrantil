import Image from "next/image";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const PageDiv = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 880px;
  background: linear-gradient(to bottom, #2c2c4a, #3c3c5c);
  border-radius: 20px 2px 2px 20px;
  box-shadow: -2px 1px 10px gray;
  transform: rotateX(10deg);
  transform-origin: center right;
  overflow: hidden;
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Skeleton = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #2c2c4a 25%, #3d3d5c 50%, #2c2c4a 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
`;

const Placeholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.28);
  font-family: "Courier New", Courier, monospace;
  font-size: 0.76rem;
  text-align: center;
  padding: 36px;
  box-sizing: border-box;
  line-height: 1.9;
  gap: 20px;
`;

const StarDecor = styled.div`
  font-size: 2.2rem;
  opacity: 0.35;
`;

export interface ILeftPageProps {
  currentPart: number;
  firstImage: string;
  secondImage: string;
  thirdImage: string;
  isImage1Loading: boolean;
  isImage2Loading: boolean;
  isImage3Loading: boolean;
}

export default function LeftPage({
  currentPart,
  firstImage,
  secondImage,
  thirdImage,
  isImage1Loading,
  isImage2Loading,
  isImage3Loading,
}: ILeftPageProps) {
  const imageMap: Record<number, string> = {
    1: firstImage,
    2: secondImage,
    3: thirdImage,
  };
  const loadingMap: Record<number, boolean> = {
    1: isImage1Loading,
    2: isImage2Loading,
    3: isImage3Loading,
  };

  const image = imageMap[currentPart];
  const isLoading = loadingMap[currentPart] ?? false;

  return (
    <PageDiv>
      {currentPart === 0 ? (
        <Placeholder>
          <StarDecor>✨</StarDecor>
          as ilustrações da sua história vão aparecer aqui
        </Placeholder>
      ) : (
        <ImageWrapper>
          {isLoading ? (
            <Skeleton />
          ) : (
            <Image
              src={image}
              alt={`Ilustração parte ${currentPart}`}
              fill
              sizes="310px"
              style={{ objectFit: "cover" }}
              priority={currentPart === 1}
            />
          )}
        </ImageWrapper>
      )}
    </PageDiv>
  );
}
