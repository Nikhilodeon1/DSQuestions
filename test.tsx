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
  const [subject, setSubject] = useState<"All" | "Math" | "English">("Math");
  const [difficulty, setDifficulty] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    fetch(DATA_URL)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => {
        console.error("Failed to fetch questions", err);
        setData({ math: [], english: [] });
      });
  }, []);

  useEffect(() => {
    if (!data) return;

    let all: Question[] = [];

    if (subject === "All") {
      all = [...data.math, ...data.english];
    } else if (subject === "Math") {
      all = data.math;
    } else if (subject === "English") {
      all = data.english;
    }

    const filtered =
      difficulty === "All"
        ? all
        : all.filter((q) => q.difficulty.toLowerCase() === difficulty.toLowerCase());

    setFilteredQuestions(filtered);

    if (filtered.length > 0) {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      setCurrentQuestion(filtered[randomIndex]);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setCurrentQuestion(null);
    }
  }, [data, subject, difficulty]);


  const handleAnswer = (choice: string) => {
    if (!currentQuestion || selectedAnswer !== null) return;

    setSelectedAnswer(choice);

    const isAnswerCorrect = choice === currentQuestion.question.correct_answer;
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setWrongCount((prev) => prev + 1);
    }
  };

  const showNext = () => {
    if (filteredQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
      setCurrentQuestion(filteredQuestions[randomIndex]);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  };

  const totalAttempts = correctCount + wrongCount;
  const correctPercentage = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;
  const wrongPercentage = totalAttempts > 0 ? 100 - correctPercentage : 0;

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <nav style={{ backgroundColor: "#0070f3", color: "white", padding: "15px 30px", fontSize: 24, fontWeight: "bold" }}>
        DailySAT
      </nav>

      <main style={{ maxWidth: 1200, margin: "auto", padding: 20, fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ color: "black" }}>
          <label>
            Subject: 
            <select value={subject} onChange={(e) => setSubject(e.target.value as "All" | "Math" | "English")} style={{ color: "black", border: "1px solid #ccc", borderRadius: 4, padding: 4 }}>
              <option value="All">All</option>
              <option value="Math">Math</option>
              <option value="English">English</option>
            </select>
          </label>

          <label style={{ marginLeft: 20 }}>
            Difficulty: 
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "All" | "Easy" | "Medium" | "Hard")} style={{ color: "black", border: "1px solid #ccc", borderRadius: 4, padding: 4 }}>
              <option value="All">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </label>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ flex: 3, border: "1px solid #ccc", padding: 20, borderRadius: 8, backgroundColor: "#f9f9f9", color: "black" }}>
            {currentQuestion ? (
              <>
                <h3>
                  {currentQuestion.domain} — {currentQuestion.difficulty}
                </h3>

                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={{ p: ({ children }) => <p style={{ color: "black" }}>{children}</p> }}>
                  {currentQuestion.question.question}
                </ReactMarkdown>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                  {Object.entries(currentQuestion.question.choices).map(([letter, text]) => {
                    const isSelected = selectedAnswer === letter;
                    const isAnswer = currentQuestion.question.correct_answer === letter;

                    let bg = "#fff";
                    if (selectedAnswer !== null) {
                      if (isSelected && isAnswer) bg = "#c8f7c5";
                      else if (isSelected) bg = "#f7c5c5";
                      else if (isAnswer) bg = "#c8f7c5";
                    }

                    return (
                      <button
                        key={letter}
                        onClick={() => handleAnswer(letter)}
                        disabled={selectedAnswer !== null}
                        style={{ padding: 10, borderRadius: 6, border: "1px solid #aaa", backgroundColor: bg, cursor: selectedAnswer ? "default" : "pointer", textAlign: "left", color: "black" }}
                      >
                        <strong>{letter}.</strong> {" "}
                        <ReactMarkdown
                          remarkPlugins={subject === "Math" ? [remarkMath] : []}
                          rehypePlugins={subject === "Math" ? [rehypeKatex] : []}
                          components={{ p: ({ children }) => <span>{children}</span> }}
                        >
                          {text}
                        </ReactMarkdown>
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer !== null && (
                  <div style={{ marginTop: 20 }}>
                    {isCorrect ? (
                      <p style={{ color: "green", fontWeight: "bold" }}>✅ Correct!</p>
                    ) : (
                      <>
                        <p style={{ color: "red", fontWeight: "bold" }}>❌ Incorrect.</p>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={{ p: ({ children }) => <p style={{ color: "black" }}>{children}</p> }}>
                          {`**Explanation:** ${currentQuestion.question.explanation}`}
                        </ReactMarkdown>
                      </>
                    )}
                    <button onClick={showNext} style={{ marginTop: 10, padding: "8px 12px", borderRadius: 4, backgroundColor: "#0070f3", color: "white", border: "none", cursor: "pointer" }}>
                      Next Question →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p>No questions found.</p>
            )}
          </div>

          <div style={{ flex: 1, border: "1px solid #ccc", padding: 20, borderRadius: 8, backgroundColor: "#f9f9f9", height: "fit-content", alignSelf: "start", color: "black" }}>
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
