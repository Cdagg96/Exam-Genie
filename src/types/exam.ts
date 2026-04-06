// src/types/exam.ts
export type QuestionType =
  | "MC"
  | "TF"
  | "Essay"
  | "FIB"
  | "Code";

export type ExamQuestionItem = {
  questionId: string;
  type: QuestionType;
  subject: string;
  courseNum: string;
  points: number;
  order?: number;
  snapshot?: any;
};

export type ExamDoc = {
  _id: string;
  title: string;
  subject: string;
  courseNum: string;
  topic: string;
  timeLimitMin: number;
  difficulty: string;
  totalPoints: number;
  questions: ExamQuestionItem[];
  instructionsDoc?: any;
};

// What you actually get from Mongo (adds timestamps / lastUsed)
export type ExamWithMeta = ExamDoc & {
  userID: string;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
};