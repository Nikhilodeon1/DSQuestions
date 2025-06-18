"use client";

import { useEffect, useState, useRef, useCallback } from "react"; // Added useRef and useCallback
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';

// Add Font Awesome CSS
if (typeof window !== 'undefined') {
    const fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    if (!document.head.querySelector('link[href*="font-awesome"]')) {
      document.head.appendChild(fontAwesomeLink);
    }
}


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

type QuestionHistory = {
  id: number;
  question: Question;
  userAnswer: string | null;
  isCorrect: boolean | null;
  isMarkedForLater: boolean;
  isAnswered: boolean;
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
  
  // Separate stats for Math and English
  const [mathCorrect, setMathCorrect] = useState<number>(0);
  const [mathWrong, setMathWrong] = useState<number>(0);
  const [englishCorrect, setEnglishCorrect] = useState<number>(0);
  const [englishWrong, setEnglishWrong] = useState<number>(0);

  // Predicted Scores
  const [predictedMathScore, setPredictedMathScore] = useState<number>(200);
  const [predictedEnglishScore, setPredictedEnglishScore] = useState<number>(200);
  
  // Toggle for expanded accuracy view
  const [isAccuracyExpanded, setIsAccuracyExpanded] = useState<boolean>(false);

  // Progress tracking
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number | null>(null);

  // Desmos Calculator State
  const [showDesmos, setShowDesmos] = useState(false);
  const desmosRef = useRef<HTMLDivElement>(null);
  const [desmosPosition, setDesmosPosition] = useState({ x: 0, y: 0 });
  const [desmosSize, setDesmosSize] = useState({ width: 400, height: 300 }); // Initial size
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0 });
  const initialSize = useRef({ width: 0, height: 0 });

  const totalAttempts = correctCount + wrongCount;
  const correctPercentage = totalAttempts === 0 ? 0 : (correctCount / totalAttempts) * 100;
  
  // Calculate subject-specific stats
  const mathTotal = mathCorrect + mathWrong;
  const mathPercentage = mathTotal === 0 ? 0 : (mathCorrect / mathTotal);
  const englishTotal = englishCorrect + englishWrong;
  const englishPercentage = englishTotal === 0 ? 0 : (englishCorrect / englishTotal);

  // Effect to update predicted scores
  useEffect(() => {
    const newMathScore = Math.round((mathPercentage * 600) + 200);
    setPredictedMathScore(newMathScore);
    
    const newEnglishScore = Math.round((englishPercentage * 600) + 200);
    setPredictedEnglishScore(newEnglishScore);

  }, [mathPercentage, englishPercentage]);

  // Create proper domain mapping
  const domainDisplayMapping = {
    // Math domains - map display names to actual domain values
    "Algebra": "Algebra",
    "Advanced Math": "Advanced Math", 
    "Problem-Solving and Data Analysis": "Problem-Solving and Data Analysis",
    "Geometry and Trigonometry": "Geometry and Trigonometry",
    // English domains - map display names to actual domain values  
    "Information and Ideas": "Information and Ideas",
    "Craft and Structure": "Craft and Structure", 
    "Expression of Ideas": "Expression of Ideas",
    "Standard English Conventions": "Standard English Conventions"
  };

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

      // Only set a new random question if we're not viewing from history
      if (currentHistoryIndex === null && newFilteredQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * newFilteredQuestions.length);
        setCurrentQuestion(newFilteredQuestions[randomIndex]);
      } else if (newFilteredQuestions.length === 0) {
        setCurrentQuestion(null);
      }

      // Reset states when not viewing from history
      if (currentHistoryIndex === null) {
        setSelectedAnswer(null);
        setIsCorrect(null);
        setShowExplanation(false);
        setIsSubmitted(false);
      }
    }
  }, [data, subject, difficulty, selectedDomain, currentHistoryIndex]);

  const handleAnswerSelect = (choice: string) => {
    if (isSubmitted) return;
    
    // Don't allow answer selection if viewing from history and already answered
    if (currentHistoryIndex !== null) {
      const historyItem = questionHistory[currentHistoryIndex];
      if (historyItem.isAnswered) {
        return;
      }
    }
    setSelectedAnswer(choice);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return;
    
    const correct = selectedAnswer === currentQuestion.question.correct_answer;
    setIsCorrect(correct);
    setIsSubmitted(true);
    
    if (correct) {
      setCorrectCount((prev) => prev + 1);
      if (subject === "Math") {
        setMathCorrect((prev) => prev + 1);
      } else {
        setEnglishCorrect((prev) => prev + 1);
      }
      setCurrentStreak((prev) => {
        const newStreak = prev + 1;
        setMaxStreak((maxPrev) => Math.max(maxPrev, newStreak));
        return newStreak;
      });
    } else {
      setWrongCount((prev) => prev + 1);
      if (subject === "Math") {
        setMathWrong((prev) => prev + 1);
      } else {
        setEnglishWrong((prev) => prev + 1);
      }
      setCurrentStreak(0);
      setShowExplanation(true);
    }

    // Update or add to question history
    if (currentHistoryIndex !== null) {
      // Update existing history item that was not answered before
      setQuestionHistory(prev => prev.map((item, index) => 
        index === currentHistoryIndex 
          ? { ...item, userAnswer: selectedAnswer, isCorrect: correct, isAnswered: true }
          : item
      ));
    } else {
       // Check if the current question is already in history (e.g., marked for later)
       const existingIndex = questionHistory.findIndex(item => item.question.id === currentQuestion.id);
       if (existingIndex !== -1) {
           setQuestionHistory(prev => prev.map((item, index) =>
               index === existingIndex
                   ? { ...item, userAnswer: selectedAnswer, isCorrect: correct, isAnswered: true }
                   : item
           ));
       } else {
           // Add new history item
           const newHistoryItem: QuestionHistory = {
               id: questionHistory.length + 1,
               question: currentQuestion,
               userAnswer: selectedAnswer,
               isCorrect: correct,
               isMarkedForLater: false,
               isAnswered: true
           };
           setQuestionHistory(prev => [...prev, newHistoryItem]);
       }
    }
  };

  const showNext = () => {
    // Reset to new random question mode
    setCurrentHistoryIndex(null);
    
    if (filteredQuestions.length > 0) {
        let nextQuestion;
        // Avoid showing the same question twice in a row
        do {
            const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
            nextQuestion = filteredQuestions[randomIndex];
        } while (currentQuestion && nextQuestion.id === currentQuestion.id && filteredQuestions.length > 1)
        setCurrentQuestion(nextQuestion);
    } else {
      setCurrentQuestion(null);
    }
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setIsSubmitted(false);
  };

  const handleMarkForLater = () => {
    if (!currentQuestion) return;

    const existingIndex = questionHistory.findIndex(item => item.question.id === currentQuestion.id);

    if (existingIndex !== -1) {
      // Question is already in history, just toggle the mark
      setQuestionHistory(prev => prev.map((item, index) => 
        index === existingIndex 
          ? { ...item, isMarkedForLater: !item.isMarkedForLater }
          : item
      ));
    } else {
      // Question not in history, add it as marked
      const newHistoryItem: QuestionHistory = {
        id: questionHistory.length + 1,
        question: currentQuestion,
        userAnswer: null,
        isCorrect: null,
        isMarkedForLater: true,
        isAnswered: false,
      };
      setQuestionHistory(prev => [...prev, newHistoryItem]);
      // If submitting an answer to a question that was only marked, we should treat it as a new submission.
      // The handleSubmit function already handles this logic.
    }
  };

  const handleProgressBoxClick = (index: number) => {
    const historyItem = questionHistory[index];
    setCurrentHistoryIndex(index);
    setCurrentQuestion(historyItem.question);
    setSelectedAnswer(historyItem.userAnswer);
    setIsCorrect(historyItem.isCorrect);
    setIsSubmitted(historyItem.isAnswered);
    // Only show explanation if it was answered and incorrect
    setShowExplanation(historyItem.isAnswered && historyItem.isCorrect === false);
  };

  const getCurrentQuestionStatus = () => {
    if (!currentQuestion) return null;
    return questionHistory.find(item => item.question.id === currentQuestion.id) || null;
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
      case "Easy": return "#4caf50";
      case "Medium": return "#F7DA1D";
      case "Hard": return "#f44336";
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
  const currentQuestionStatus = getCurrentQuestionStatus();
  const isViewingAnsweredHistory = currentHistoryIndex !== null && questionHistory[currentHistoryIndex]?.isAnswered;


  // Desmos Calculator Drag and Resize Logic
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, type: 'drag' | 'resize') => {
    if (desmosRef.current) {
      const rect = desmosRef.current.getBoundingClientRect();
      if (type === 'drag') {
        isDragging.current = true;
        dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      } else { // resize
        isResizing.current = true;
        resizeStart.current = { x: e.clientX, y: e.clientY };
        initialSize.current = { width: rect.width, height: rect.height };
      }
      e.preventDefault();
      document.body.style.userSelect = 'none'; // Prevent text selection during drag/resize
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current && desmosRef.current) {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      setDesmosPosition({ x: newX, y: newY });
    } else if (isResizing.current && desmosRef.current) {
      const deltaX = e.clientX - resizeStart.current.x;
      const deltaY = e.clientY - resizeStart.current.y;
      
      const newWidth = Math.max(300, initialSize.current.width + deltaX); // Min width 300px
      const newHeight = Math.max(200, initialSize.current.height + deltaY); // Min height 200px
      setDesmosSize({ width: newWidth, height: newHeight });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    isResizing.current = false;
    document.body.style.userSelect = ''; // Restore text selection
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  // Set initial position of Desmos calculator in the middle of the screen
  useEffect(() => {
    if (typeof window !== 'undefined' && desmosRef.current && showDesmos) {
      const rect = desmosRef.current.getBoundingClientRect();
      setDesmosPosition({
        x: (window.innerWidth / 2) - (rect.width / 2),
        y: (window.innerHeight / 2) - (rect.height / 2)
      });
    }
  }, [showDesmos]);


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
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "24px", fontWeight: "bolder" }}>DailySAT</span>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
            <span style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Predicted Score</span>
            <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                <div style={{fontSize: '16px', color: '#333'}}>
                    <span style={{fontWeight: '600'}}>Math:</span> 
                    {mathTotal === 0 ? 
                        <span style={{color: '#9e9e9e', fontWeight: 'bold'}}> ---</span> : 
                        <span style={{color: '#4285f4', fontWeight: 'bold'}}> {predictedMathScore}</span>
                    }
                </div>
                <div style={{fontSize: '16px', color: '#333'}}>
                    <span style={{fontWeight: '600'}}>English:</span>
                    {englishTotal === 0 ?
                         <span style={{color: '#9e9e9e', fontWeight: 'bold'}}> ---</span> : 
                         <span style={{color: '#4285f4', fontWeight: 'bold'}}> {predictedEnglishScore}</span>
                    }
                </div>
            </div>
        </div>
      </div>

      <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
        {/* Left Sidebar */}
        <div
          style={{
            width: "250px",
            backgroundColor: "#f8f9fa",
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
                  width: "100px"
                }}
              >
                <option value="Math">🧮 Math</option>
                <option value="English">📖 English</option>
              </select><i className="fas fa-chevron-down" style={{ fontSize: "14px" }}></i>
            </div>
          </div>
          <div style={{
            height: "2px",
            backgroundColor: "#6e6e6e",
            width: "140px",
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
                  backgroundColor: selectedDomain === "All" ? "#e3f2fd" : "#e3f2fd",
                  border: selectedDomain === "All" ? "2px solid #2196f3" : "0px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  textAlign: "left",
                  color: "black",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <i className="fas fa-list" style={{ marginRight: "8px" }}></i>
                All Topics
              </button>
              {currentDomainNames.map((domainName) => (
                <button
                  key={domainName}
                  onClick={() => setSelectedDomain(domainDisplayMapping[domainName as keyof typeof domainDisplayMapping])}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: selectedDomain === domainDisplayMapping[domainName as keyof typeof domainDisplayMapping] ? "#e3f2fd" : "#e3f2fd",
                    border: selectedDomain === domainDisplayMapping[domainName as keyof typeof domainDisplayMapping] ? "2px solid #2196f3" : "0px solid #ddd",
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
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>Choose Difficulty:</div>
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
                      backgroundColor: getDifficultyColor(diff),
                      cursor: "pointer",
                      fontSize: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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
                {/* Question Header with Mark for Later button */}
                <div
                  style={{
                    backgroundColor: "#e8f4f8",
                    padding: "10px 15px",
                    borderRadius: "6px",
                    marginBottom: "20px",
                    fontSize: "14px",
                    color: "black",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "bold" }}>Topic:</span> {currentQuestion.domain} |{" "}
                    <span style={{ fontWeight: "bold" }}>Difficulty:</span> {currentQuestion.difficulty}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}> {/* Container for buttons */}
                    <button
                      onClick={() => setShowDesmos(!showDesmos)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: showDesmos ? "#e3f2fd" : "#fff", // Slightly different background when active
                        border: `1px solid ${showDesmos ? "#2196f3" : "#ddd"}`,
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: showDesmos ? "#2196f3" : "#666",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      title="Launch Desmos Calculator"
                    >
                      <i className="fas fa-calculator"></i>
                    </button>
                    <button
                      onClick={handleMarkForLater}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: currentQuestionStatus?.isMarkedForLater ? "#fffbe6" : "#fff",
                        border: `1px solid ${currentQuestionStatus?.isMarkedForLater ? "#ffc107" : "#ddd"}`,
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: currentQuestionStatus?.isMarkedForLater ? "#ff8f00" : "#666",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      title="Mark for Later"
                    >
                      <i className={`fa-bookmark ${currentQuestionStatus?.isMarkedForLater ? 'fas' : 'far'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Question */}
                <div style={{ marginBottom: "20px", fontSize: "16px", lineHeight: "1.5", color: "#000000", fontWeight: "bold"}}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {currentQuestion.question.question}
                  </ReactMarkdown>
                </div>

                {/* Answer Choices */}
                <div style={{ marginBottom: "20px" }}>
                  {Object.entries(currentQuestion.question.choices).map(([key, value]) => {
                    const isSelected = selectedAnswer === key;
                    const isCorrectChoice = key === currentQuestion.question.correct_answer;

                    let borderColor = "#ddd";
                    let backgroundColor = "white";

                    if (isSubmitted) {
                        if(isCorrectChoice){
                            borderColor = "#4caf50";
                            backgroundColor = "#e8f5e9";
                        } else if (isSelected && !isCorrect) {
                            borderColor = "#f44336";
                            backgroundColor = "#ffebee";
                        }
                    } else if (isSelected) {
                        borderColor = "#2196f3";
                        backgroundColor = "#e3f2fd";
                    }

                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswerSelect(key)}
                        disabled={isViewingAnsweredHistory}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "15px",
                          marginBottom: "10px",
                          border: `2px solid ${borderColor}`,
                          borderRadius: "6px",
                          backgroundColor: backgroundColor,
                          cursor: isViewingAnsweredHistory ? "not-allowed" : "pointer",
                          textAlign: "left",
                          fontSize: "16px",
                          color: "black",
                          transition: "all 0.2s",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          opacity: isViewingAnsweredHistory ? 0.7 : 1
                        }}
                      >
                        {subject === "Math" ? (
                          <>
                            <span style={{ fontWeight: "bold", marginRight: "8px" }}>{key}.</span>
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                p: ({ node, ...props }) => <span style={{display: 'inline'}} {...props} />,
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
                    );
                  })}
                </div>

                {/* Submit / Next Buttons */}
                 <div style={{ display: "flex", gap: "10px" }}>
                    {isSubmitted ? (
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
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      >
                        Next <i className="fas fa-arrow-right"></i>
                      </button>
                    ) : (
                       !isViewingAnsweredHistory && (
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedAnswer}
                            style={{
                            padding: "12px 24px",
                            backgroundColor: "#4285f4",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: selectedAnswer ? "pointer" : "not-allowed",
                            fontSize: "16px",
                            fontWeight: "bold",
                            opacity: selectedAnswer ? 1 : 0.6,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                        >
                            Submit
                        </button>
                       )
                    )}
                 </div>


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
              position: "relative" // Needed for absolute positioning of accuracy dropdown
            }}
          >
            {/* Streak */}
            <div
              style={{
                backgroundColor: "#eff6ff",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                overflow: 'hidden'
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#292F33", background: "#99c6ff", paddingTop: "10px", paddingBottom: "12px", textAlign: "left", paddingLeft: "15px", margin: "0px"}}>
                <i className="fas fa-fire" style={{ marginRight: "8px" }}></i>
                Streak
              </div>
              <div style={{ fontSize: "48px", fontWeight: "bold", color: "#292F33", textAlign: "center", padding: '10px 0'}}>
                {currentStreak}
              </div>
            </div>

            {/* Accuracy */}
            <div
              style={{
                backgroundColor: "#eff6ff",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                position: "relative",
                zIndex: isAccuracyExpanded ? 10 : 1 // Ensure it overlaps
              }}
            >
              <div style={{ 
                fontSize: "16px", 
                fontWeight: "bold", 
                color: "#292F33", 
                background: "#99c6ff", 
                padding: "10px 15px 12px 15px",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: 'pointer'
              }}
              onClick={() => setIsAccuracyExpanded(!isAccuracyExpanded)}
              >
                <span>
                  <i className="fas fa-bullseye" style={{ marginRight: "8px" }}></i>
                  Accuracy
                </span>
                <i 
                    className={`fas fa-chevron-${isAccuracyExpanded ? 'up' : 'down'}`}
                    style={{
                      transition: 'transform 0.3s ease'
                    }}
                  ></i>
              </div>
              
              {/* Overall Stats (Always visible part) */}
              <div style={{color: "black", padding:"15px"}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                  <span><i className="far fa-check-circle" style={{ marginRight: "8px",color: "#4caf50" }}></i>Correct: <strong>{correctCount}</strong></span>
                  <span><i className="far fa-times-circle" style={{ marginRight: "8px",color: "#f66055" }}></i>Incorrect: <strong>{wrongCount}</strong></span>
                </div>
                <div style={{
                  height: "17px",
                  backgroundColor: totalAttempts === 0 ? "#e0e0e0" : "#f66055",
                  borderRadius: "10px",
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}>
                  <div
                    style={{
                      width: `${correctPercentage}%`,
                      height: "100%",
                      backgroundColor: "#4caf50",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Expanded Subject-Specific Stats */}
              <div
                style={{
                  position: "absolute",
                  top: "100%", // Position below the main accuracy box
                  left: 0,
                  right: 0,
                  backgroundColor: "#eff6ff",
                  borderBottomLeftRadius: "8px",
                  borderBottomRightRadius: "8px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  maxHeight: isAccuracyExpanded ? "300px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.4s ease-in-out, padding 0.4s ease-in-out",
                  padding: isAccuracyExpanded ? "15px" : "0 15px",
                  color: 'black',
                  borderTop: isAccuracyExpanded ? '1px solid #b0cfff' : 'none'
                }}
              >
                 {/* Math Stats */}
                 <div style={{marginBottom: "15px"}}>
                    <div style={{fontWeight: 'bold', marginBottom: '5px'}}><i className="fas fa-square-root-alt" style={{ marginRight: "8px" }}></i> Math</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                        <span><i className="far fa-check-circle" style={{ marginRight: "8px",color: "#4caf50" }}></i>Correct: <strong>{mathCorrect}</strong></span>
                        <span><i className="far fa-times-circle" style={{ marginRight: "8px",color: "#f66055"}}></i>Incorrect: <strong>{mathWrong}</strong></span>
                    </div>
                     <div style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)", height: "12px", backgroundColor: mathTotal === 0 ? "#e0e0e0" : "#f66055", borderRadius: "10px", overflow: "hidden" }}>
                        <div style={{ width: `${mathPercentage * 100}%`, height: "100%", backgroundColor: "#4caf50", transition: "width 0.3s ease" }} />
                    </div>
                 </div>

                 {/* English Stats */}
                 <div>
                    <div style={{fontWeight: 'bold', marginBottom: '5px'}}><i className="fas fa-book-open" style={{ marginRight: "8px" }}></i>English</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                        <span><i className="far fa-check-circle" style={{ marginRight: "8px",color: "#4caf50" }}></i>Correct: <strong>{englishCorrect}</strong></span>
                        <span><i className="far fa-times-circle" style={{ marginRight: "8px",color: "#f66055" }}></i>Incorrect: <strong>{englishWrong}</strong></span>
                    </div>
                     <div style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)", height: "12px", backgroundColor: englishTotal === 0 ? "#e0e0e0" : "#f66055", borderRadius: "10px", overflow: "hidden" }}>
                        <div style={{ width: `${englishPercentage * 100}%`, height: "100%", backgroundColor: "#4caf50", transition: "width 0.3s ease" }} />
                    </div>
                 </div>
              </div>
            </div>

            {/* Progress Box */}
            <div
              style={{
                backgroundColor: "#eff6ff",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                overflow: 'hidden'
              }}
            >
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#292F33", background: "#99c6ff", paddingTop: "10px", paddingBottom: "12px", textAlign: "left", paddingLeft: "15px", margin: "0px"}}>
                    <i className="fas fa-tasks" style={{ marginRight: "8px" }}></i>
                    Progress
                </div>
                <div style={{
                    padding: '15px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    color: 'white',
                    maxHeight: '125px',
                    overflowY: 'auto'
                }}>
                    {questionHistory.length === 0 && <span style={{color: 'grey', fontSize: '14px'}}>Answer questions to see your progress.</span>}
                    {questionHistory.map((item, index) => {
                        let bgColor;
                        if (item.isMarkedForLater) {
                            bgColor = "#ffc107"; // Yellow for marked, takes precedence
                        } else if (item.isCorrect === true) {
                            bgColor = "#66bb6a"; // Green for correct
                        } else if (item.isCorrect === false) {
                            bgColor = "#ef5350"; // Red for incorrect
                        } else {
                            bgColor = "#b0bec5"; // Default grey for unanswered
                        }

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleProgressBoxClick(index)}
                                title={`Question ${index + 1}`}
                                style={{
                                    width: '35px',
                                    height: '35px',
                                    borderRadius: '6px',
                                    backgroundColor: bgColor,
                                    border: currentHistoryIndex === index ? '3px solid #0d47a1' : 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    color: 'white',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    flexShrink: 0 // Prevent boxes from shrinking
                                }}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Desmos Calculator Embed */}
      {showDesmos && (
        <div
          ref={desmosRef}
          style={{
            position: 'fixed',
            top: desmosPosition.y,
            left: desmosPosition.x,
            width: desmosSize.width,
            height: desmosSize.height,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              cursor: 'grab',
              backgroundColor: '#f1f1f1',
              padding: '8px 12px',
              borderBottom: '1px solid #ccc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#333'
            }}
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
          >
            Desmos Calculator
            <button
              onClick={() => setShowDesmos(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              &times;
            </button>
          </div>
          <iframe
            src="https://www.desmos.com/calculator"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="Desmos Calculator"
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '15px',
              height: '15px',
              cursor: 'nwse-resize',
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderTopLeftRadius: '5px',
            }}
            onMouseDown={(e) => handleMouseDown(e, 'resize')}
          />
        </div>
      )}
    </div>
  );
}