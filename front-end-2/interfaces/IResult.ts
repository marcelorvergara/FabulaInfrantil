export interface IMessage {
  role: string;
  content: string;
}

interface Result {
  message: IMessage;
  finish_reason: string;
  index: number;
}

export interface IResult {
  result: Result;
}
