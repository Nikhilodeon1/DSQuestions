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
    <div className="flex min-h-screen bg-white text-black font-sans p-10">
      <div className="w-1/3 space-y-4">
        <h2 className="text-3xl font-bold">Practice</h2>

        {[ 
          { label: "SUBJECT", value: subject, setValue: setSubject, options: ["Math", "English"] },
          { label: "DIFFICULTY", value: difficulty, setValue: setDifficulty, options: ["All", "Easy", "Medium", "Hard"] },
          {
            label: "DOMAIN",
            value: selectedDomain,
            setValue: setSelectedDomain,
            options: subject === "Math" ? mathDomains : englishDomains,
          },
        ].map(({ label, value, setValue, options }) => (
          <div className="space-y-2 bg-blue-50 p-4 rounded-lg" key={label}>
            <label className="text-xs font-semibold text-blue-700">{label}</label>
            <select
              value={value}
              onChange={(e) => setValue(e.target.value as typeof value)}  
              className="w-full p-2 border rounded-md"
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}

        {[
          { label: "Correct Answers", value: correctCount },
          { label: "Incorrect Answers", value: wrongCount },
        ].map(({ label, value }) => (
          <div className="bg-blue-50 p-4 rounded-lg" key={label}>
            <h3 className="text-sm font-bold mb-2">{label}:</h3>
            <div className="text-3xl font-semibold">{value}</div>
          </div>
        ))}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-bold mb-2">Accuracy:</h3>
          <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${correctPercentage}%` }}></div>
            <div className="h-full bg-red-500" style={{ width: `${wrongPercentage}%` }}></div>
          </div>
        </div>
      </div>

      <div className="w-2/3 pl-10">
        {currentQuestion ? (
          <div className="space-y-4">
            <div className="text-lg font-semibold">{currentQuestion.domain} — {currentQuestion.difficulty}</div>
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {currentQuestion.question.question}
              </ReactMarkdown>
            </div>

            <div className="space-y-2">
              {Object.entries(currentQuestion.question.choices).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleAnswer(key)}
                  disabled={selectedAnswer !== null}
                  className={`block w-full text-left p-3 rounded-lg border transition ${
                    selectedAnswer === key
                      ? isCorrect
                        ? "bg-green-100 border-green-400"
                        : "bg-red-100 border-red-400"
                      : selectedAnswer && key === currentQuestion.question.correct_answer
                      ? "bg-green-100 border-green-400"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {`${key}. ${value}`}
                  </ReactMarkdown>
                </button>
              ))}
            </div>

            {selectedAnswer && (
              <div>
                <p className={`font-bold ${
                  isCorrect ? "text-green-600" : "text-red-600"
                }`}>{isCorrect ? "Correct!" : "Incorrect."}</p>
                {!isCorrect && (
                  <div className="prose mt-2">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {currentQuestion.question.explanation}
                    </ReactMarkdown>
                  </div>
                )}
                <button
                  onClick={showNext}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Next Question
                </button>
              </div>
            )}
          </div>
        ) : (
          <p>Fetching questions...</p>
        )}
      </div>
    </div>
  );
}
