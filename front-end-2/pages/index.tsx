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

const placeHolderImg =
  "https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png";

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

  const handleAge = (ageStr: string) => {
    setAge(ageStr);
  };

  const handleKw = async (kw: string) => {
    if (kw === "") {
      setKeyword("Uma história legal");
    } else {
      setKeyword(kw);
    }

    try {
      setIsLoading(true);
      // send to the back-end api to generate story
      const res = await getText(kw, age);
      const resultJson = (await res.json()) as IResult;

      // text to show in screen
      setResult(resultJson);
      // text to share after story is complete
      setStory([kw]);
      // if there is an error in the generation of the story
      if (resultJson.result.message.content.indexOf("\n") === -1) {
        setResetPage(true);
        setIsLoading(false);
        return;
      }

      // Unblock UI immediately — image loads in the background
      setIsLoading(false);

      setIsImage1Loading(true);
      generateImage(
        "gere uma figura  para uma criança com idade entre " +
          age.replace("_", " e ") +
          " anos que resume o seguinte texto:\n" +
          keyword +
          ".\n" +
          getFirst60Percent(
            resultJson.result.message.content.replace("\\n", " ")
          )
      )
        .then((r) => r.json())
        .then((j) => { setFirstImage(j.result); setIsImage1Loading(false); })
        .catch((err) => { console.error("Image 1 failed:", err); setIsImage1Loading(false); });
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleOption = async (text: string) => {
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
          .catch((err) => { console.error("Image 2 failed:", err); setIsImage2Loading(false); });
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleOption2 = async (text: string) => {
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
          .catch((err) => { console.error("Image 3 failed:", err); setIsImage3Loading(false); });
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
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
      // time necessary to store images in storage
      setTimeout(function () {
        window.open(
          `https://story.fabulainfantil.com/shareStory/${storyIdJson}`
        );
      }, 1500);
    }
  }

  return (
    <main>
    <FirstDiv>
      <MotherDiv>
        <Wrapper>
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
          <BackCover onSendReset={handleReset} shareStory={shareStory} />
        </Wrapper>
      </MotherDiv>
    </FirstDiv>
    </main>
  );
}
