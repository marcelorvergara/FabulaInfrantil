export async function getText(
  kw: string,
  age: string,
  continueStory?: Array<{ role: string; content: string }>
) {
  const messages: { role: string; content: string }[] = [];

  if (continueStory) {
    messages.push(...continueStory);
  }

  const fetchWithExponentialBackoff = async (
    attempt = 0
  ): Promise<Response> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_SRV}/generate/${kw}/${age}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "",
            messages,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Fetch failed");
      }

      return response;
    } catch (error) {
      const maxAttempts = 5;
      const delay = Math.pow(2, attempt) * 1000; // exponential backoff delay

      if (attempt >= maxAttempts) {
        console.error("Exceeded max number of attempts");
        throw error;
      }

      console.warn(`Fetch failed. Retrying after ${delay}ms...`);
      await sleep(delay);
      return fetchWithExponentialBackoff(attempt + 1);
    }
  };

  return await fetchWithExponentialBackoff();
}

// image generation
export async function generateImage(strToGenerate: string): Promise<Response> {
  const fetchWithExponentialBackoff = async (
    attempt = 0
  ): Promise<Response> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_SRV}/generateImage`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Origin: `${process.env.NEXT_PUBLIC_BACKEND_SRV}`,
          },
          body: JSON.stringify({
            prompt: strToGenerate,
            n: 1,
            size: "256x256",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Fetch failed");
      }

      return response;
    } catch (error) {
      const maxAttempts = 5;
      const delay = Math.pow(2, attempt) * 1000; // exponential backoff delay

      if (attempt >= maxAttempts) {
        console.error("Exceeded max number of attempts");
        throw error;
      }

      console.warn(`Fetch failed. Retrying after ${delay}ms...`);
      await sleep(delay);
      return fetchWithExponentialBackoff(attempt + 1);
    }
  };

  return await fetchWithExponentialBackoff();
}

// share story
export async function shareStoryHelper(
  story: string[],
  firstImage: string,
  secondImage: string,
  thirdImage: string
): Promise<Response> {
  const fetchWithExponentialBackoff = async (
    attempt = 0
  ): Promise<Response> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_SRV}/shareStory`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Origin: `${process.env.NEXT_PUBLIC_BACKEND_SRV}`,
          },
          body: JSON.stringify({
            story,
            firstImage,
            secondImage,
            thirdImage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Fetch failed");
      }

      return response;
    } catch (error) {
      const maxAttempts = 5;
      const delay = Math.pow(2, attempt) * 1000; // exponential backoff delay

      if (attempt >= maxAttempts) {
        console.error("Exceeded max number of attempts");
        throw error;
      }

      console.warn(`Fetch failed. Retrying after ${delay}ms...`);
      await sleep(delay);
      return fetchWithExponentialBackoff(attempt + 1);
    }
  };

  return await fetchWithExponentialBackoff();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
