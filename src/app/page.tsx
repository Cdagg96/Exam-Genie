"use client";

import React, { useState, useEffect } from "react";
import NavBar from "@/components/navbar";
import Link from "next/link";
import { Background } from "@/components/BackgroundModal";
import Image from "next/image";

type Step = {
  id: string;
  title: string;
  description: string;
  route?: string;
  video?: string;
  buttonName?: string;
};

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome",
    description: "Welcome to Exam Genie, a tool designed for professors to create, manage, and generate professional exams effortlessly. Store questions once, reuse them across semesters, and maintain full control over exam structure. Use the tabs above or buttons below to continue to explore how Exam Genie works.",
  },
  {
    id: "questions",
    title: "Manage Questions",
    description: "Create, edit, and organize your question bank. Add multiple choice, true/false, fill in the blank, code, and essay questions.",
    route: "/data_view",
    video: "/videos/QuestionsPageTutorial.mp4",
    buttonName: "Go to questions page",
  },
  {
    id: "generate",
    title: "Generate Exam",
    description: "Enter exam details, select questions, assign point values, and choose how your exam is organized.",
    route: "/exam_gen",
    video: "/videos/ExamGenerationPageTutorial.mp4",
    buttonName: "Go to generator page",
  },
  {
    id: "edit",
    title: "Exams",
    description: "Review and update existing exams, reorder questions, adjust settings, or remove exams when they are no longer needed.",
    route: "/past_exams",
    video: "videos/EditExamPageTutorial.mp4",
    buttonName: "Go to exams page",
  },
  {
    id: "print",
    title: "Download Exams",
    description: "Download polished exams and answer keys, ready for printing and classroom use.",
    video: "videos/DownloadExamTutorial.mp4",
  },
];

export default function Home() {
  const [active, setActive] = useState<Step>(STEPS[0]);
  const [nextButton, setNextButton] = useState<boolean>(true);
  const [backButton, setBackButton] = useState<boolean>(false);

  const currentStep = STEPS.findIndex((step) => step.id === active.id);

  useEffect(() => {
    setNextButton(currentStep < STEPS.length - 1);
    setBackButton(currentStep > 0);
  }, [active]);

  return (
    <Background>
      <div className="items-center justify-items-center min-h-screen p-4">
        <NavBar />

        {/* Home page title */}
        <h1 className="text-7xl pt-18 text-blue-gradient">
          Exam Genie
        </h1>
        <p className="mt-3 text-center text-secondary">
          Build, preview, and print professional exams in minutes.
        </p>

        <div className="w-full max-w-5xl mx-auto mt-16">
          <div className="card-primary shadow-lg overflow-hidden">
            {/* Clickable tabs at the top of tutorial */}
            <div className="flex bg-secondary border border-slate-200 dark:border-black">
              {STEPS.map((step) => {
                const isActive = step.id === active.id;

                return (
                  <button
                    key={step.id}
                    onClick={() => setActive(step)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition
                      ${isActive
                          ? "bg-sky-300 dark:bg-[#111827] text-primary"
                          : "text-secondary hover:bg-secondary"
                      }
                    `}
                  >
                    {step.title}
                  </button>
                );
              })}
            </div>

            <div className="p-8">
              <h3 className="text-2xl font-semibold mb-4 text-primary">
                {active.title}
              </h3>
              <p className="text-secondary">{active.description}</p>

              {/* Video/Welcome box */}
              {active.video ? (
                <div className="mt-6 rounded-xl border-secondary bg-secondary overflow-hidden aspect-video">
                  <video
                    key={active.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    <source src={active.video} />
                  </video>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Image
                    src="/geniecanvas.png"
                    alt="Exam Genie Pencil and Canvas"
                    width={220}
                    height={220}
                    priority
                  />
                </div>
              )}

              {/* Buttons at the bottom of tutorial */}
              <div className="flex items-center justify-between">
                <div>
                  {active.route && (
                    <div className="mt-6 flex">
                      <Link href={active.route} className="btn btn-ghost">
                        {active.buttonName || active.title}
                      </Link>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  {backButton && (
                    <button
                      onClick={() => {
                        const current = STEPS.findIndex((step) => step.id === active.id);
                        if (current > 0) {
                          setActive(STEPS[current - 1]);
                        }
                      }}
                      className="btn btn-ghost mt-6"
                    >
                      Back
                    </button>
                  )}
                  {nextButton ? (
                    <button
                      onClick={() => {
                        const current = STEPS.findIndex((step) => step.id === active.id);
                        if (current < STEPS.length - 1) {
                          setActive(STEPS[current + 1]);
                        }
                      }}
                      className="btn btn-primary-blue mt-6"
                    >
                      Next
                    </button>
                  ) : (
                    <Link href="/data_view" className="btn btn-primary-blue mt-6">Get started</Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Background>
  );
}