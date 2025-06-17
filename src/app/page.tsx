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
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);

  const totalAttempts = correctCount + wrongCount;
  const correctPercentage = totalAttempts === 0 ? 0 : (correctCount / totalAttempts) * 100;

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(DATA_URL);
        const jsonData: Data = await response.json();
        setData(jsonData);

        const uniqueMathDomains = Array.from(new Set(jsonData.math.map((q) => q.domain)));
        setMathDomains(uniqueMathDomains);

        const uniqueEnglishDomains = Array.from(new Set(jsonData.english.map((q) => q.domain)));
        setEnglishDomains(uniqueEnglishDomains);
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
      setShowExplanation(false);
      setIsSubmitted(false);
    }
  }, [data, subject, difficulty, selectedDomain]);

  const handleAnswerSelect = (choice: string) => {
    setSelectedAnswer(choice);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    const correct = selectedAnswer === currentQuestion?.question.correct_answer;
    setIsCorrect(correct);
    setIsSubmitted(true);
    
    if (correct) {
      setCorrectCount((prev) => prev + 1);
      setCurrentStreak((prev) => {
        const newStreak = prev + 1;
        setMaxStreak((maxPrev) => Math.max(maxPrev, newStreak));
        return newStreak;
      });
    } else {
      setWrongCount((prev) => prev + 1);
      setCurrentStreak(0);
      setShowExplanation(true);
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
    setShowExplanation(false);
    setIsSubmitted(false);
  };

  const getDifficultyEmoji = (diff: string) => {
    switch (diff) {
      case "All": return "❓";
      case "Easy": return "😊";
      case "Medium": return "😐";
      case "Hard": return "😠";
      default: return "❓";
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy": return "#4caf50"; // Green
      case "Medium": return "#F7DA1D"; // Yellow
      case "Hard": return "#f44336"; // Red
      default: return "white";
    }
  };

  const getDifficultyTooltip = (diff: string) => {
    switch (diff) {
      case "All": return "Any Difficulty";
      case "Easy": return "Easy";
      case "Medium": return "Medium";
      case "Hard": return "Hard";
      default: return "";
    }
  };

  const mathDomainNames = ["Algebra", "Advanced Math", "Problem-Solving and Data Analysis", "Geometry and Trigonometry"];
  const englishDomainNames = ["Information and Ideas", "Craft and Structure", "Expression of Ideas", "Standard English Conventions"];
  
  const currentDomainNames = subject === "Math" ? mathDomainNames : englishDomainNames;

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          color: "#4285f4",
          padding: "15px 20px",
          fontSize: "24px",
          fontWeight: "bold",
          borderBottom: "1px solid #ddd",
        }}
      >
        DailySAT
      </div>

      <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
        {/* Left Sidebar */}
        <div
          style={{
            width: "250px",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            height: "fit-content",
          }}
        >
          {/* Subject Selector */}
          <div style={{ marginBottom: "0px", position: "relative" }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px", color: "#333", position: "relative" }}> 
              <select
                onChange={(e) => setSubject(e.target.value as "Math" | "English")}
                value={subject}
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#333",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  marginLeft: "8px",
                  marginRight: "3px",
                  width: "70px"
                }}
              >
                <option value="Math">➗ Math</option>
                <option value="English">📖 English </option>
              </select><span style={{ fontSize: "14px" }}>▾</span>
            </div>
          </div>
          <div style={{
            height: "2px",
            backgroundColor: "#6e6e6e",
            width: "110px",
            marginBottom: "20px"
          }}></div>

          {/* Topics */}
          <div style={{ marginBottom: "30px" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>Topics:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => setSelectedDomain("All")}
                style={{
                  padding: "8px 12px",
                  backgroundColor: selectedDomain === "All" ? "#eff6ff" : "#eff6ff",
                  border: selectedDomain === "All" ? "2px solid #2196f3" : "0px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  textAlign: "left",
                  color: "black",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                All Topics
              </button>
              {currentDomainNames.map((domainName, index) => (
                <button
                  key={domainName}
                  onClick={() => setSelectedDomain(subject === "Math" ? mathDomains[index] : englishDomains[index])}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: selectedDomain === (subject === "Math" ? mathDomains[index] : englishDomains[index]) ? "#eff6ff" : "#eff6ff",
                    border: selectedDomain === (subject === "Math" ? mathDomains[index] : englishDomains[index]) ? "2px solid #2196f3" : "0px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    textAlign: "left",
                    color: "black",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {domainName}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>Difficulty:</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {["All", "Easy", "Medium", "Hard"].map((diff) => (
                <div key={diff} style={{ position: "relative" }}>
                  <button
                    onClick={() => setDifficulty(diff as "All" | "Easy" | "Medium" | "Hard")}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: difficulty === diff ? "3px solid #2196f3" : "2px solid #ddd",
                      backgroundColor: difficulty === diff ? getDifficultyColor(diff) : getDifficultyColor(diff),
                      cursor: "pointer",
                      fontSize: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={getDifficultyTooltip(diff)}
                  >
                    {getDifficultyEmoji(diff)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: "flex", gap: "20px" }}>
          {/* Question Area */}
          <div
            style={{
              flex: 2,
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              color: "black"
            }}
          >
            {currentQuestion ? (
              <>
                {/* Question Header */}
                <div
                  style={{
                    backgroundColor: "#e8f4f8",
                    padding: "10px 15px",
                    borderRadius: "6px",
                    marginBottom: "20px",
                    fontSize: "14px",
                    color: "black",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>Topic:</span> {currentQuestion.domain} |{" "}
                  <span style={{ fontWeight: "bold" }}>Difficulty:</span> {currentQuestion.difficulty}
                </div>

                {/* Question */}
                <div style={{ marginBottom: "20px", fontSize: "16px", lineHeight: "1.5", color: "#000000"}}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {currentQuestion.question.question}
                  </ReactMarkdown>
                </div>

                {/* Answer Choices */}
                <div style={{ marginBottom: "20px" }}>
                  {Object.entries(currentQuestion.question.choices).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleAnswerSelect(key)}
                      disabled={isSubmitted}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "15px",
                        marginBottom: "10px",
                        border: `2px solid ${
                          selectedAnswer === key
                            ? "#2196f3"
                            : isSubmitted && key === currentQuestion.question.correct_answer
                            ? "#4caf50"
                            : "#ddd"
                        }`,
                        borderRadius: "6px",
                        backgroundColor:
                          selectedAnswer === key
                            ? isSubmitted
                              ? isCorrect
                                ? "#e8f5e8"
                                : "#ffeaea"
                              : "#e3f2fd"
                            : isSubmitted && key === currentQuestion.question.correct_answer
                            ? "#e8f5e8"
                            : "white",
                        cursor: !isSubmitted ? "pointer" : "not-allowed",
                        textAlign: "left",
                        fontSize: "16px",
                        color: "black",
                        transition: "all 0.2s",
                      }}
                    >
                      {subject === "Math" ? (
                        <>
                          <span style={{ fontWeight: "bold", marginRight: "8px" }}>{key}.</span>
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({ node, ...props }) => <span {...props} />,
                            }}
                          >
                            {`$${value}$`}
                          </ReactMarkdown>
                        </>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({ node, ...props }) => <span {...props} />,
                          }}
                        >
                          {`${key}. ${value}`}
                        </ReactMarkdown>
                      )}
                    </button>
                  ))}
                </div>

                {/* Submit Button */}
                {selectedAnswer && !isSubmitted && (
                  <button
                    onClick={handleSubmit}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#4285f4",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                      marginBottom: "15px",
                    }}
                  >
                    Submit
                  </button>
                )}

                {/* Next Button */}
                {isSubmitted && (
                  <button
                    onClick={showNext}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#4285f4",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    Next
                  </button>
                )}

                {/* Explanation */}
                {showExplanation && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "15px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      color: "#000000"
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: "10px", color: "black" }}>Explanation:</div>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {currentQuestion.question.explanation}
                    </ReactMarkdown>
                  </div>
                )}
              </>
            ) : (
              <p>Fetching questions...</p>
            )}
          </div>

          {/* Right Sidebar - Stats */}
          <div
            style={{
              width: "250px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Streak */}
            <div
              style={{
                backgroundColor: "#eff6ff",
                padding: "0px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#292F33", background: "#99c6ff", paddingTop: "10px", paddingBottom: "12px", textAlign: "left", paddingLeft: "8px", margin: "0px", borderTopLeftRadius: "8px",borderTopRightRadius: "8px"}}>Streak</div>
              <div style={{ fontSize: "48px", fontWeight: "bold", color: "#292F33", textAlign: "center"}}>
                {currentStreak}
              </div>
            </div>

            {/* Accuracy */}
            <div
              style={{
                backgroundColor: "#eff6ff",
                paddingBottom: "5px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#292F33", background: "#99c6ff", paddingTop: "10px", paddingBottom: "12px", textAlign: "left", paddingLeft: "8px", borderTopLeftRadius: "8px",borderTopRightRadius: "8px"}}>Accuracy</div>
              <div style={{color: "black", padding:"8px"}}>
                <div style={{marginTop: "5px",marginBottom: "5px"}}>✅ Correct: <strong>{correctCount}</strong><span style={{marginLeft:"25px"}}>❌ Incorrect: <strong>{wrongCount}</strong></span></div>
                <div style={{
                  height: "17px",
                  backgroundColor: totalAttempts === 0 ? "#ccc" : "#f66055",
                  borderRadius: "10px",
                  overflow: "hidden",
                  position: "relative",
                  marginTop: "10px"
                }}>
                <div
                  style={{
                    width: `${correctPercentage}%`,
                    height: "100%",
                    backgroundColor: totalAttempts === 0 ? "#ccc" : "#4caf50",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}