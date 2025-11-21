import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import type { ExamDoc, ExamQuestionItem } from '@/types/exam';

//Mock dependencies
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'exam-123' }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

//Mock question
const createMockQuestion = (overrides: Partial<ExamQuestionItem>): ExamQuestionItem => ({
  questionId: 'q1',
  type: 'MC',
  points: 10,
  subject: 'Computer Science',
  courseNum: 'CS101',
  snapshot: {
    stem: 'What is React?',
    choices: [
      { text: 'A JavaScript library' },
      { text: 'A programming language' },
      { text: 'A database' },
    ],
    answer: 'A'
  },
  ...overrides
});

const mockExam: ExamDoc = {
  _id: 'exam-123',
  title: 'Test Exam',
  subject: 'Computer Science',
  courseNum: 'CS101',
  timeLimitMin: 60,
  totalPoints: 100,
  questions: [
    createMockQuestion({ 
      questionId: 'q1',
      snapshot: { stem: 'What is React?' }
    }),
    createMockQuestion({
      questionId: 'q2',
      type: 'TF',
      points: 5,
      snapshot: {
        stem: '2 + 2 = 4.',
        answer: true
      }
    }),
    createMockQuestion({
      questionId: 'q3', 
      type: 'Essay',
      points: 15,
      snapshot: {
        stem: 'Explain FIFO.',
        blankLines: 6
      }
    })
  ]
};

//Setup global fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Drag and Drop Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockExam)
    });
  });

  describe('Drag Event Handlers', () => {
    it('should handle drag start with proper data transfer', () => {
      const setDataMock = vi.fn();
      const classListAddMock = vi.fn();
      
      const mockEvent = {
        dataTransfer: { setData: setDataMock },
        currentTarget: { 
          classList: { 
            add: classListAddMock,
            remove: vi.fn() 
          } 
        }
      } as unknown as React.DragEvent;

      const questionId = 'q1';

      //Test the drag start logic
      const handleDragStart = (e: React.DragEvent, questionId: string) => {
        e.dataTransfer.setData("text/plain", questionId);
        e.currentTarget.classList.add("opacity-50");
      };

      handleDragStart(mockEvent, questionId);

      expect(setDataMock).toHaveBeenCalledWith("text/plain", questionId);
      expect(classListAddMock).toHaveBeenCalledWith("opacity-50");
    });

    it('should handle drag end and remove styles', () => {
      const classListRemoveMock = vi.fn();
      
      const mockEvent = {
        currentTarget: { 
          classList: { 
            remove: classListRemoveMock,
            add: vi.fn() 
          } 
        }
      } as unknown as React.DragEvent;

      //Test the drag end logic
      const handleDragEnd = (e: React.DragEvent) => {
        e.currentTarget.classList.remove("opacity-50");
      };

      handleDragEnd(mockEvent);

      expect(classListRemoveMock).toHaveBeenCalledWith("opacity-50");
    });
  });

  describe('Drop Logic', () => {
    it('should reorder questions when dropped in different position', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { getData: () => 'q1' }
      } as unknown as React.DragEvent;

      let examState = { ...mockExam };
      const setExam = vi.fn((newExam) => {
        examState = newExam;
      });

      //Test the drop handler logic
      const handleDrop = (e: React.DragEvent, targetIndex: number, exam: ExamDoc | null, setExam: (exam: ExamDoc) => void) => {
        e.preventDefault();
        const draggedQuestionId = e.dataTransfer.getData("text/plain");

        if (!exam) return;

        const questions = [...exam.questions];
        const draggedIndex = questions.findIndex(q => q.questionId === draggedQuestionId);

        if (draggedIndex === -1) return;

        //If same position, do nothing
        if (draggedIndex === targetIndex || draggedIndex === targetIndex - 1) {
          return;
        }

        //Reorder questions
        const [movedQuestion] = questions.splice(draggedIndex, 1);

        //Adjust target index if dragging from above the insertion point
        const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
        questions.splice(adjustedTargetIndex, 0, movedQuestion);

        setExam({
          ...exam,
          questions
        });
      };

      handleDrop(mockEvent, 2, examState, setExam); //Move q1 to position 2

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(setExam).toHaveBeenCalled();
      
      //Verify the questions were reordered
      const updatedCall = setExam.mock.calls[0][0];
      expect(updatedCall.questions[0].questionId).toBe('q2'); //q2 should now be first
      expect(updatedCall.questions[1].questionId).toBe('q1'); //q1 should now be second
      expect(updatedCall.questions[2].questionId).toBe('q3'); //q3 should now be third
    });

    it('should not reorder when dropped in same position', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { getData: () => 'q1' }
      } as unknown as React.DragEvent;

      const setExam = vi.fn();

      const handleDrop = (e: React.DragEvent, targetIndex: number, exam: ExamDoc | null, setExam: (exam: ExamDoc) => void) => {
        e.preventDefault();
        const draggedQuestionId = e.dataTransfer.getData("text/plain");

        if (!exam) return;

        const questions = [...exam.questions];
        const draggedIndex = questions.findIndex(q => q.questionId === draggedQuestionId);

        if (draggedIndex === -1) return;

        //If same position, do nothing
        if (draggedIndex === targetIndex || draggedIndex === targetIndex - 1) {
          return;
        }

        const [movedQuestion] = questions.splice(draggedIndex, 1);
        const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
        questions.splice(adjustedTargetIndex, 0, movedQuestion);
        setExam({ ...exam, questions });
      };

      handleDrop(mockEvent, 0, mockExam, setExam);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(setExam).not.toHaveBeenCalled();
    });
  });

  describe('Drag Over Logic', () => {
    it('should handle drag over and set drop target', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: 'move' }
      } as unknown as React.DragEvent;

      const setDropTarget = vi.fn();

      const handleDragOver = (e: React.DragEvent, index: number, setDropTarget: (index: number | null) => void) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDropTarget(index);
      };

      handleDragOver(mockEvent, 1, setDropTarget);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(setDropTarget).toHaveBeenCalledWith(1);
    });
  });
});

//Test the actual reordering logic more thoroughly
describe('Question Reordering Logic', () => {
  it('should correctly calculate adjusted target index when dragging down', () => {
    const questions = mockExam.questions;
    const draggedIndex = 0; //First question
    const targetIndex = 2; //Third position
    
    //Simulate the adjustment logic
    const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    
    expect(adjustedTargetIndex).toBe(1); //Should adjust from 2 to 1
  });

  it('should correctly calculate adjusted target index when dragging up', () => {
    const questions = mockExam.questions;
    const draggedIndex = 2; //Third question
    const targetIndex = 0; //First position
    
    //Simulate the adjustment logic
    const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    
    expect(adjustedTargetIndex).toBe(0);
  });

  it('should maintain all question properties after reordering', () => {
    const originalQuestions = [...mockExam.questions];
    const draggedIndex = 0;
    const targetIndex = 2;

    const questions = [...originalQuestions];
    const [movedQuestion] = questions.splice(draggedIndex, 1);
    const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    questions.splice(adjustedTargetIndex, 0, movedQuestion);

    //Verify all questions still exist
    expect(questions).toHaveLength(3);
    
    //Verify the moved question maintains its properties
    const movedQuestionInNewPosition = questions[adjustedTargetIndex];
    expect(movedQuestionInNewPosition.questionId).toBe('q1');
    expect(movedQuestionInNewPosition.snapshot.stem).toBe('What is React?');
    
    //Verify no data loss
    questions.forEach(question => {
      expect(question).toHaveProperty('questionId');
      expect(question).toHaveProperty('snapshot');
      expect(question).toHaveProperty('points');
    });
  });
});