export type QuestionType =
  | "MC"
  | "TF"
  | "Essay"
  | "FIB"
  | "Code";

export interface Choice {
    label: string;
    text: string;
    isCorrect: boolean;
}

export interface Question {
    _id: string;
    stem: string;
    type: QuestionType;
    difficulty: string;
    topics: string[];
    subject: string;
    courseNum: string;
    choices: Choice[];
    answer: string;
    lastUsed: string | null;
    userID: string;
}