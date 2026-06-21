import { useEffect, useState } from "react";

export function useTypewriter(
  text: string,
  intervalMs = 120
): [string, boolean] {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      setDone(false);
      return;
    }
    setDisplayed("");
    setDone(false);
    const words = text.split(" ");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(words.slice(0, i).join(" "));
      if (i >= words.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [text]);

  return [displayed, done];
}
