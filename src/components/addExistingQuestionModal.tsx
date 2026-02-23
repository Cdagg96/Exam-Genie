"use client";

import React, { useEffect, useMemo, useState } from "react";
import SelectBox from "@/components/SelectBox";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthContext";
import type { Question } from "@/types/question";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAddSelected: (questions: Question[]) => void;
  excludeIds?: Set<string>; // questionIds already in exam
};

export default function AddExistingQuestionModal({
  isOpen,
  onClose,
  onAddSelected,
  excludeIds,
}: Props) {
  const { user } = useAuth();

  // data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  // selection
  const [selected, setSelected] = useState<Map<string, Question>>(new Map());

  // filtering states
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedCourseNum, setSelectedCourseNum] = useState<string>("");
  const [filtersApplied, setFiltersApplied] = useState(false);

  // local search inside results
  const [search, setSearch] = useState("");

  // for pages
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredQuestions = questions;

  const visibleQuestions = useMemo(() => {
    const base = excludeIds?.size
      ? filteredQuestions.filter((q) => !excludeIds.has(q._id))
      : filteredQuestions;

    const s = search.trim().toLowerCase();
    if (!s) return base;

    return base.filter((q) => {
      const inStem = q.stem?.toLowerCase().includes(s);
      const inTopics = (q.topics ?? []).some((t) => t.toLowerCase().includes(s));
      return inStem || inTopics;
    });
  }, [filteredQuestions, excludeIds, search]);

  const totalPages = Math.max(1, Math.ceil(visibleQuestions.length / pageSize));

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return visibleQuestions.slice(start, start + pageSize);
  }, [visibleQuestions, page]);

  // Build unique lists
  const topics = useMemo(() => {
    const unique = Array.from(new Set(questions.flatMap((q) => q.topics ?? [])));
    return unique.map((t) => ({ value: t, label: t }));
  }, [questions]);

  const subjects = useMemo(() => {
    const unique = Array.from(
      new Set(questions.map((q) => q.subject?.trim()).filter((s): s is string => !!s))
    );
    return unique.map((s) => ({ value: s, label: s }));
  }, [questions]);

  const courseNums = useMemo(() => {
    const unique = Array.from(
      new Set(questions.map((q) => q.courseNum?.trim()).filter((s): s is string => !!s))
    );
    return unique.map((c) => ({ value: c, label: c }));
  }, [questions]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      if (!user?._id) {
        setQuestions([]);
        setFiltersApplied(false);
        return;
      }
      const response = await fetch(`../api/questions?userID=${user._id}`, { method: "GET" });
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      setQuestions(Array.isArray(data) ? data : []);
      setFiltersApplied(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionsWithFilters = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (!user?._id) {
      setQuestions([]);
      setFiltersApplied(false);
      return;
    }
    params.append("userID", user._id);
      if (selectedTopic) params.append("topic", selectedTopic);
      if (selectedDifficulty) params.append("difficulty", selectedDifficulty);
      if (selectedType) params.append("type", selectedType);
      if (selectedSubject) params.append("subject", selectedSubject);
      if (selectedCourseNum) params.append("courseNum", selectedCourseNum);

      const queryString = params.toString();
      const url = queryString ? `../api/questions?${queryString}` : "../api/questions";

      const response = await fetch(url, { method: "GET" });
      if (!response.ok) throw new Error("Failed to fetch questions");

      const data = await response.json();
      setQuestions(Array.isArray(data) ? data : []);
      setFiltersApplied(queryString.length > 0);

      setPage(1);
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch filtered questions");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => fetchQuestionsWithFilters();

  const handleClearFilters = () => {
    setSelectedTopic("");
    setSelectedDifficulty("");
    setSelectedType("");
    setSelectedSubject("");
    setSelectedCourseNum("");
    setFiltersApplied(false);
    setSearch("");
    setPage(1);
    fetchQuestions();
  };

  const toggleSelect = (q: Question) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(q._id)) next.delete(q._id);
      else next.set(q._id, q);
      return next;
    });
  };

  const handleAddSelected = () => {
    const picked = Array.from(selected.values());
    if (picked.length === 0) return;
    onAddSelected(picked);
    onClose();
  };

  // fetch when opened
  useEffect(() => {
    if (!isOpen) return;
    fetchQuestions();
    setSelected(new Map());
    setPage(1);
    setSearch("");
  }, [isOpen]);

  // keep page valid
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-primary text-primary rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">Add Existing Questions</h2>
          <button onClick={onClose} className="text-3xl leading-none text-gray-500 hover:text-black">
            &times;
          </button>
        </div>

        {/* Filters */}
        <div className="p-5 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SelectBox
              label=""
              placeholder="Topic"
              options={[{ value: "", label: "All topics" }, ...topics]}
              value={selectedTopic}
              onSelect={(v) => setSelectedTopic(v)}
            />

            <SelectBox
              label=""
              placeholder="Difficulty"
              options={[
                { value: "", label: "All difficulties" },
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
                { value: "5", label: "5" },
              ]}
              value={selectedDifficulty}
              onSelect={(v) => setSelectedDifficulty(v)}
            />

            <SelectBox
              label=""
              placeholder="Type"
              options={[
                { value: "", label: "All types" },
                { value: "MC", label: "Multiple Choice" },
                { value: "TF", label: "True/False" },
                { value: "FIB", label: "Fill in the Blank" },
                { value: "Essay", label: "Essay" },
                { value: "Code", label: "Code" },
              ]}
              value={selectedType}
              onSelect={(v) => setSelectedType(v)}
            />

            <SelectBox
              label=""
              placeholder="Subject"
              options={[{ value: "", label: "All subjects" }, ...subjects]}
              value={selectedSubject}
              onSelect={(v) => setSelectedSubject(v)}
            />

            <SelectBox
              label=""
              placeholder="Course #"
              options={[{ value: "", label: "All courses" }, ...courseNums]}
              value={selectedCourseNum}
              onSelect={(v) => setSelectedCourseNum(v)}
            />

            <input
              className="border px-3 py-2 rounded-lg"
              placeholder="Search (stem/topics)"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilters}
                className="btn btn-primary-blue"
                disabled={loading}
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="btn btn-ghost"
                disabled={loading}
              >
                Clear
              </button>
            </div>

            <div className="text-sm text-primary">
              {filtersApplied ? "Filters applied" : "No filters"} • Selected:{" "}
              <span className="font-medium text-secondary">{selected.size}</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-secondary">Loading questions...</div>
          ) : pageItems.length === 0 ? (
            <div className="text-secondary">No questions found.</div>
          ) : (
            <div className="space-y-3">
              {pageItems.map((q) => {
                const checked = selected.has(q._id);
                return (
                  <div
                    key={q._id}
                    className={`border rounded-xl p-3 transition ${checked ? "bg-gray-200 dark:bg-gray-400" : "hover:bg-gray-200 dark:hover:bg-gray-400"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        onChange={() => toggleSelect(q)}
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-primary leading-snug">{q.stem || "(No stem)"}</div>
                          <span className="text-xs px-2 py-0.5 rounded border text-secondary">
                            {q.type}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-secondary">
                          {q.subject} • {q.courseNum} • {(q.topics ?? []).slice(0, 3).join(", ")}
                          {(q.topics?.length ?? 0) > 3 ? "…" : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-5 flex items-center justify-between">
            <button
              className="btn btn-ghost"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <div className="text-sm text-primary">
              Page {page} / {totalPages}
            </div>
            <button
              className="btn btn-ghost"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4 flex items-center justify-between">
          <button onClick={onClose} className="px-3 py-2 btn btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleAddSelected}
            disabled={selected.size === 0}
            className="px-3 py-2 btn btn-primary-blue"
          >
            Add Selected ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
