import ShareStory from "../repository/shareStory.repo";

async function shareStory(story: string) {
  return await ShareStory.shareStory(story);
}

async function getStory(storyId: string) {
  return await ShareStory.getStory(storyId);
}

async function storeImage(
  storyId: string,
  firstImg: string,
  secondImg: string,
  thirdImg: string
): Promise<string[]> {
  return await ShareStory.storeImage(storyId, [firstImg, secondImg, thirdImg]);
}

async function storeImagesSettled(
  storyId: string,
  firstImg: string,
  secondImg: string,
  thirdImg: string
): Promise<(string | null)[]> {
  return await ShareStory.storeImagesSettled(storyId, [
    firstImg,
    secondImg,
    thirdImg,
  ]);
}

async function setImageExts(storyId: string, imageExts: string[]) {
  return await ShareStory.setImageExts(storyId, imageExts);
}

export default {
  shareStory,
  getStory,
  storeImage,
  storeImagesSettled,
  setImageExts,
};
