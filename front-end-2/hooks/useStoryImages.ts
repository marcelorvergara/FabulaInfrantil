import { useState } from "react";
import { generateImage } from "@/helpers/fetchHelper";

const placeHolderImg = "/placeholder.png";

export function useStoryImages() {
  const [firstImage, setFirstImage] = useState(placeHolderImg);
  const [secondImage, setSecondImage] = useState(placeHolderImg);
  const [thirdImage, setThirdImage] = useState(placeHolderImg);
  const [isImage1Loading, setIsImage1Loading] = useState(false);
  const [isImage2Loading, setIsImage2Loading] = useState(false);
  const [isImage3Loading, setIsImage3Loading] = useState(false);
  const [image1Error, setImage1Error] = useState(false);
  const [image2Error, setImage2Error] = useState(false);
  const [image3Error, setImage3Error] = useState(false);

  const slotSetters = {
    1: { setImage: setFirstImage, setLoading: setIsImage1Loading, setError: setImage1Error },
    2: { setImage: setSecondImage, setLoading: setIsImage2Loading, setError: setImage2Error },
    3: { setImage: setThirdImage, setLoading: setIsImage3Loading, setError: setImage3Error },
  } as const;

  function generateStoryImage(slot: 1 | 2 | 3, prompt: string) {
    const { setImage, setLoading, setError } = slotSetters[slot];
    setLoading(true);
    setError(false);
    generateImage(prompt)
      .then((r) => r.json())
      .then((j) => {
        setImage(j.result);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Image ${slot} failed:`, err);
        setImage(placeHolderImg);
        setError(true);
        setLoading(false);
      });
  }

  function resetImages() {
    setFirstImage(placeHolderImg);
    setSecondImage(placeHolderImg);
    setThirdImage(placeHolderImg);
    setIsImage1Loading(false);
    setIsImage2Loading(false);
    setIsImage3Loading(false);
    setImage1Error(false);
    setImage2Error(false);
    setImage3Error(false);
  }

  return {
    firstImage,
    secondImage,
    thirdImage,
    isImage1Loading,
    isImage2Loading,
    isImage3Loading,
    image1Error,
    image2Error,
    image3Error,
    generateStoryImage,
    resetImages,
  };
}
