export interface IBody {
  model: string;
  messages: IMessage[];
  temperature: number;
  n: number;
}

export interface IMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
