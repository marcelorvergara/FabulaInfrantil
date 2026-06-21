const Cover = dynamic(() => import("@/components/Cover"), {
  loading: () => <div></div>,
  ssr: false,
});
const AgePage = dynamic(() => import("@/components/AgePage"), {
  loading: () => <div></div>,
  ssr: false,
});
const KeywordPage = dynamic(() => import("@/components/KeywordPage"), {
  loading: () => <div></div>,
  ssr: false,
});
const ThirdPage = dynamic(() => import("@/components/ThirdPage"), {
  loading: () => <div></div>,
  ssr: false,
});
const FourthPage = dynamic(() => import("@/components/FourthPage"), {
  loading: () => <div></div>,
  ssr: false,
});
const LastPage = dynamic(() => import("@/components/LastPage"), {
  loading: () => <div></div>,
  ssr: false,
});
const BackCover = dynamic(() => import("@/components/BackCover"), {
  loading: () => <div></div>,
  ssr: false,
});
import {
  generateImage,
  getText,
  shareStoryHelper,
} from "@/helpers/fetchHelper";
import { IMessage, IResult } from "@/interfaces/IResult";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { getFirst60Percent } from "@/helpers/generalFunctions";
import dynamic from "next/dynamic";

const FirstDiv = styled.div`
  position: relative;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin-top: 22px;
`;

const MotherDiv = styled.div`
  position: relative;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  /* Styles for desktop */
  @media (min-width: 768px) {
    justify-content: center;
  }
  /* Styles for smartphones */
  @media (max-width: 340px) {
    justify-content: start;
  }
`;

const Wrapper = styled.section`
  padding: 2px;
  margin-right: 18px;
  padding-right: 12px;
  width: 340px;
`;

const ErrorCard = styled.div`
  position: absolute;
  z-index: 10;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff5f5;
  border: 1.5px solid #e57373;
  border-radius: 12px;
  padding: 24px 28px;
  text-align: center;
  width: 270px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-family: "Courier New", Courier, monospace;
`;

const ErrorText = styled.p`
  color: #b71c1c;
  font-size: 0.88rem;
  line-height: 1.5;
  margin-bottom: 18px;
`;

const RetryButton = styled.button`
  cursor: pointer;
  background: #ffd700;
  border: none;
  border-radius: 50px;
  color: #1a1a3e;
  padding: 10px 28px;
  font-size: 0.88rem;
  font-weight: bold;
  font-family: "Courier New", Courier, monospace;
  box-shadow: 0 3px 10px rgba(255, 215, 0, 0.4);
  transition: transform 0.1s;
  &:hover { transform: translateY(-2px); }
  &:active { transform: translateY(0); }
`;

const placeHolderImg = "/placeholder.png";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [age, setAge] = useState("");
  const [result, setResult] = useState<IResult>();
  const [resetPage, setResetPage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [story, setStory] = useState<string[]>([""]);
  const [firstImage, setFirstImage] = useState(placeHolderImg);
  const [secondImage, setSecondImage] = useState(placeHolderImg);
  const [thirdImage, setThirdImage] = useState(placeHolderImg);
  const [isImage1Loading, setIsImage1Loading] = useState(false);
  const [isImage2Loading, setIsImage2Loading] = useState(false);
  const [isImage3Loading, setIsImage3Loading] = useState(false);
  const [firstPart, setFirstPart] = useState<IMessage[]>([
    {
      role: "",
      content: "",
    },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");

  const handleAge = (ageStr: string) => {
    setAge(ageStr);
  };

  const handleKw = async (kw: string) => {
    const resolvedKw = kw === "" ? "Uma história legal" : kw;
    setKeyword(resolvedKw);
    setErrorMessage(null);

    try {
      setIsLoading(true);
      const res = await getText(resolvedKw, age);
      const resultJson = (await res.json()) as IResult;

      setResult(resultJson);
      setStory([resolvedKw]);

      if (resultJson.result.message.content.indexOf("\n") === -1) {
        setResetPage(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);

      setIsImage1Loading(true);
      generateImage(
        "gere uma figura  para uma criança com idade entre " +
          age.replace("_", " e ") +
          " anos que resume o seguinte texto:\n" +
          resolvedKw +
          ".\n" +
          getFirst60Percent(
            resultJson.result.message.content.replace("\\n", " ")
          )
      )
        .then((r) => r.json())
        .then((j) => { setFirstImage(j.result); setIsImage1Loading(false); })
        .catch((err) => { console.error("Image 1 failed:", err); setFirstImage(placeHolderImg); setIsImage1Loading(false); });
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setErrorMessage("Ops! Não foi possível gerar a história. Tente novamente.");
    }
  };

  const handleOption = async (text: string) => {
    setErrorMessage(null);
    try {
      setIsLoading(true);
      if (result?.result.message) {
        // store the first part of the story
        const choosedOption: IMessage = result?.result.message;
        // create the object to send the selected option
        const selectedOption = { role: "user", content: text };
        // create the array to send the first part and the selected option
        const continueStory = [
          {
            role: "system",
            content:
              "lembre-se de dar as 3 opções mencionadas no início desse chat",
          },
          choosedOption,
          selectedOption,
        ];
        // send to the back-end
        const resultOption = await getText(keyword, age, continueStory);
        const resultJson = (await resultOption.json()) as IResult;
        // store the first part to send to the backend
        setFirstPart([choosedOption, selectedOption]);

        setResult(resultJson);
        // text to share after story is complete
        const storyCp = story;
        storyCp?.push(choosedOption.content, selectedOption.content);
        setStory(storyCp);

        // Unblock UI immediately — image loads in the background
        setIsLoading(false);

        setIsImage2Loading(true);
        generateImage(
          "gere uma imgaem sem texto para uma criança com idade entre " +
            age.replace("_", " e ") +
            " anos sobre o seguinte texto: " +
            keyword +
            ". " +
            getFirst60Percent(
              resultJson.result.message.content.replace("\\n", " ")
            )
        )
          .then((r) => r.json())
          .then((j) => { setSecondImage(j.result); setIsImage2Loading(false); })
          .catch((err) => { console.error("Image 2 failed:", err); setSecondImage(placeHolderImg); setIsImage2Loading(false); });
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setErrorMessage("Ops! Não foi possível continuar a história. Tente novamente.");
    }
  };

  const handleOption2 = async (text: string) => {
    setErrorMessage(null);
    try {
      setIsLoading(true);
      if (result?.result.message) {
        // store the second part of the story
        const choosedOption: IMessage = result?.result.message;
        // create the object to send the selected option
        const selectedOption = { role: "user", content: text };
        // create the array to send the first, second part and the selected option
        const continueStory = [...firstPart, choosedOption, selectedOption];
        continueStory.push({
          role: "user",
          content:
            "gere o final da história com a opção escolhida e não dê mais opções para o usuário escolher",
        });
        // send to the back-end
        const resultOption = await getText(keyword, age, continueStory);
        const resultJson = (await resultOption.json()) as IResult;

        setResult(resultJson);
        // text to share after story is complete
        const storyCp = story;
        storyCp?.push(
          choosedOption.content,
          selectedOption.content,
          resultJson.result.message.content
        );
        setStory(storyCp);

        // Unblock UI immediately — image loads in the background
        setIsLoading(false);

        setIsImage3Loading(true);
        generateImage(
          "gere uma imgaem sem texto para uma criança com idade entre " +
            age.replace("_", " e ") +
            " anos sobre o seguinte texto: " +
            keyword +
            ". " +
            getFirst60Percent(
              resultJson.result.message.content.replace("\\n", " ")
            )
        )
          .then((r) => r.json())
          .then((j) => { setThirdImage(j.result); setIsImage3Loading(false); })
          .catch((err) => { console.error("Image 3 failed:", err); setThirdImage(placeHolderImg); setIsImage3Loading(false); });
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setErrorMessage("Ops! Não foi possível gerar o final da história. Tente novamente.");
    }
  };

  const handleReset = (cond: boolean) => {
    setResetPage(cond);
    setResult({} as IResult);
    setFirstImage(placeHolderImg);
    setSecondImage(placeHolderImg);
    setThirdImage(placeHolderImg);
    setIsImage1Loading(false);
    setIsImage2Loading(false);
    setIsImage3Loading(false);
    setErrorMessage(null);
    setShareStatus("idle");
  };

  useEffect(() => {
    if (resetPage) {
      setResetPage(false);
    }
  }, [resetPage]);

  async function shareStory() {
    const storyId = await shareStoryHelper(
      story,
      firstImage,
      secondImage,
      thirdImage
    );

    if (storyId !== null) {
      const storyIdJson = await storyId.json();
      const shareUrl = `https://story.fabulainfantil.com/shareStory/${storyIdJson}`;
      // time necessary to store images in storage
      setTimeout(function () {
        window.open(shareUrl);
      }, 1500);
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("copied");
      } catch {
        setShareStatus("error");
      }
      setTimeout(() => setShareStatus("idle"), 3000);
    }
  }

  return (
    <main>
    <FirstDiv>
      <MotherDiv>
        <Wrapper>
          {errorMessage && (
            <ErrorCard>
              <ErrorText>{errorMessage}</ErrorText>
              <RetryButton onClick={() => handleReset(true)}>Tentar novamente</RetryButton>
            </ErrorCard>
          )}
          <Cover />
          <KeywordPage
            onSendKw={handleKw}
            resetPage={resetPage}
            result={result}
          />
          <AgePage onSendAge={handleAge} resetPage={resetPage} />
          <ThirdPage
            onSendOption={handleOption}
            resetPage={resetPage}
            result={result}
            isLoading={isLoading}
            isImageLoading={isImage1Loading}
            image={firstImage}></ThirdPage>
          <FourthPage
            onSendOption={handleOption2}
            resetPage={resetPage}
            result={result}
            isLoading={isLoading}
            isImageLoading={isImage2Loading}
            image={secondImage}></FourthPage>
          <LastPage
            resetPage={resetPage}
            result={result}
            isLoading={isLoading}
            isImageLoading={isImage3Loading}
            image={thirdImage}></LastPage>
          <BackCover onSendReset={handleReset} shareStory={shareStory} shareStatus={shareStatus} />
        </Wrapper>
      </MotherDiv>
    </FirstDiv>
    </main>
  );
}
