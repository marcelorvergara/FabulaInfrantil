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
) {
  return await ShareStory.storeImage(storyId, [firstImg, secondImg, thirdImg]);
}

export default {
  shareStory,
  getStory,
  storeImage,
};
