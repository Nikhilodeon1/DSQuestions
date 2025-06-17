"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const DATA_URL = "https://api.jsonsilo.com/public/942c3c3b-3a0c-4be3-81c2-12029def19f5";

type Question = {
  id: string;
  domain: string;
  visuals: { type: string; svg_content: string };
  question: {
    choices: Record<string, string>;
    question: string;
    paragraph: string | null;
    explanation: string;
    correct_answer: string;
  };
  difficulty: "Easy" | "Medium" | "Hard" | string;
};

type Data = {
  math: Question[];
  english: Question[];
};

export default function HomePage() {
  const [data, setData] = useState<Data | null>(null);
  const [subject, setSubject] = useState<"Math" | "English">("Math");
  const [difficulty, setDifficulty] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [mathDomains, setMathDomains] = useState<string[]>([]);
  const [englishDomains, setEnglishDomains] = useState<string[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);

  const totalAttempts = correctCount + wrongCount;
  const correctPercentage = totalAttempts === 0 ? 0 : (correctCount / totalAttempts) * 100;
  const wrongPercentage = totalAttempts === 0 ? 0 : (wrongCount / totalAttempts) * 100;

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(DATA_URL);
        const jsonData: Data = await response.json();
        setData(jsonData);

        const uniqueMathDomains = Array.from(new Set(jsonData.math.map((q) => q.domain)));
        setMathDomains(["All", ...uniqueMathDomains]);

        const uniqueEnglishDomains = Array.from(new Set(jsonData.english.map((q) => q.domain)));
        setEnglishDomains(["All", ...uniqueEnglishDomains]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      setSelectedDomain("All");
    }
  }, [subject, data]);

  useEffect(() => {
    if (data) {
      let currentSubjectQuestions: Question[] = subject === "Math" ? data.math : data.english;

      let newFilteredQuestions = currentSubjectQuestions;

      if (difficulty !== "All") {
        newFilteredQuestions = newFilteredQuestions.filter((q) => q.difficulty === difficulty);
      }

      if (selectedDomain !== "All") {
        newFilteredQuestions = newFilteredQuestions.filter((q) => q.domain === selectedDomain);
      }

      setFilteredQuestions(newFilteredQuestions);

      if (newFilteredQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * newFilteredQuestions.length);
        setCurrentQuestion(newFilteredQuestions[randomIndex]);
      } else {
        setCurrentQuestion(null);
      }

      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  }, [data, subject, difficulty, selectedDomain]);

  const handleAnswer = (choice: string) => {
    setSelectedAnswer(choice);
    setIsCorrect(choice === currentQuestion?.question.correct_answer);
    if (choice === currentQuestion?.question.correct_answer) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setWrongCount((prev) => prev + 1);
    }
  };

  const showNext = () => {
    if (filteredQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
      setCurrentQuestion(filteredQuestions[randomIndex]);
    } else {
      setCurrentQuestion(null);
    }
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "white", color: "black", minHeight: "100vh" }}>
      <nav
        style={{
          background: "#007bff",
          padding: 15,
          textAlign: "center",
          fontSize: 24,
          marginBottom: 20,
          fontWeight: "bold",
          color: "white",
        }}
      >
        DailySAT
      </nav>

      <main style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 20 }}>
          <div style={{ flex: 1, marginRight: 10 }}>
            <label htmlFor="subject-select" style={{ marginRight: 10 }}>
              Subject:
            </label>
            <select
              id="subject-select"
              onChange={(e) => setSubject(e.target.value as "Math" | "English")}
              value={subject}
              style={{ padding: 8, borderRadius: 5, border: "1px solid #ccc" }}
            >
              <option value="Math">Math</option>
              <option value="English">English</option>
            </select>
          </div>

          <div style={{ flex: 1, marginRight: 10 }}>
            <label htmlFor="difficulty-select" style={{ marginRight: 10 }}>
              Difficulty:
            </label>
            <select
              id="difficulty-select"
              onChange={(e) => setDifficulty(e.target.value as "All" | "Easy" | "Medium" | "Hard")}
              value={difficulty}
              style={{ padding: 8, borderRadius: 5, border: "1px solid #ccc" }}
            >
              <option value="All">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="domain-select" style={{ marginRight: 10 }}>
              Domain:
            </label>
            <select
              id="domain-select"
              onChange={(e) => setSelectedDomain(e.target.value)}
              value={selectedDomain}
              style={{ padding: 8, borderRadius: 5, border: "1px solid #ccc" }}
            >
              {(subject === "Math" ? mathDomains : englishDomains).map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <div
            style={{
              flex: 3,
              border: "1px solid #ccc",
              padding: 20,
              borderRadius: 8,
              backgroundColor: "#f9f9f9",
              color: "black",
            }}
          >
            {currentQuestion ? (
              <>
                <p style={{ fontSize: 16, marginBottom: 10, color: "#555" }}>
                  <strong>Domain:</strong> {currentQuestion.domain} | <strong>Difficulty:</strong> {currentQuestion.difficulty}
                </p>
                <div style={{ marginBottom: 20, fontSize: 18 }}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {currentQuestion.question.question}
                  </ReactMarkdown>
                </div>
                <div>
                  {Object.entries(currentQuestion.question.choices).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleAnswer(key)}
                      disabled={selectedAnswer !== null}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: 10,
                        marginBottom: 10,
                        border: `1px solid ${selectedAnswer === key ? "#007bff" : "#ccc"}`,
                        borderRadius: 5,
                        backgroundColor:
                          selectedAnswer === key
                            ? isCorrect
                              ? "#d4edda"
                              : "#f8d7da"
                            : selectedAnswer !== null && key === currentQuestion.question.correct_answer
                            ? "#d4edda"
                            : "#e9ecef",
                        cursor: selectedAnswer === null ? "pointer" : "not-allowed",
                        textAlign: "left",
                        fontSize: 16,
                        color: "black",
                      }}
                    >
                      <strong>{key}:</strong>{" "}
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {value}
                      </ReactMarkdown>
                    </button>
                  ))}
                </div>
                {selectedAnswer && (
                  <div style={{ marginTop: 20 }}>
                    {isCorrect ? (
                      <p style={{ color: "green", fontWeight: "bold" }}>Correct!</p>
                    ) : (
                      <>
                        <p style={{ color: "red", fontWeight: "bold" }}>Incorrect.</p>
                        <p style={{ marginTop: 10, fontSize: 14, color: "#333" }}>
                          <strong style={{ color: "black" }}>Explanation:</strong>{" "}
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {currentQuestion.question.explanation}
                          </ReactMarkdown>
                        </p>
                      </>
                    )}
                    <button
                      onClick={showNext}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: 5,
                        cursor: "pointer",
                        marginTop: 15,
                        fontSize: 16,
                      }}
                    >
                      Next Question
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p>No questions found.</p>
            )}
          </div>

          <div
            style={{
              flex: 1,
              border: "1px solid #ccc",
              padding: 20,
              borderRadius: 8,
              backgroundColor: "#f9f9f9",
              height: "fit-content",
              alignSelf: "start",
              color: "black",
            }}
          >
            <h3>📊 Your Score</h3>
            <p>
              ✅ Correct: <strong>{correctCount}</strong>
              <br />
              ❌ Incorrect: <strong>{wrongCount}</strong>
            </p>
            <div style={{ height: 10, backgroundColor: "#eee", borderRadius: 5, marginTop: 5, display: "flex" }}>
              <div
                style={{
                  width: `${correctPercentage}%`,
                  backgroundColor: totalAttempts > 0 ? "#4caf50" : "gray",
                  height: "100%",
                  borderTopLeftRadius: 5,
                  borderBottomLeftRadius: 5,
                  transition: "width 0.3s ease",
                }}
              />
              <div
                style={{
                  width: `${wrongPercentage}%`,
                  backgroundColor: totalAttempts > 0 ? "#f44336" : "gray",
                  height: "100%",
                  borderTopRightRadius: 5,
                  borderBottomRightRadius: 5,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
