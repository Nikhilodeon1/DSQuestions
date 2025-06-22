"use client";

import React, { useState, useEffect } from 'react';

type OptionState = {
    text: string;
    state: "n" | "c" | "i";
};

async function getNewQuestion(
    setStimulus: React.Dispatch<React.SetStateAction<string>>,
    setStem: React.Dispatch<React.SetStateAction<string>>,
    setOption1: React.Dispatch<React.SetStateAction<OptionState>>,
    setOption2: React.Dispatch<React.SetStateAction<OptionState>>,
    setOption3: React.Dispatch<React.SetStateAction<OptionState>>,
    setOption4: React.Dispatch<React.SetStateAction<OptionState>>,
    setAns: React.Dispatch<React.SetStateAction<string | null>>,
    ind: number,
    setDiff: React.Dispatch<React.SetStateAction<string>>
): Promise<void> {
    try {
        const questionListResponse = await fetch(
            'https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': 'your-cookie-here',
                },
                body: JSON.stringify({
                    asmtEventId: 100,
                    test: 1,
                    domain: 'INI,CAS,EOI,SEC',
                }),
            }
        );

        const questionList = await questionListResponse.json();

        if (questionList.length === 0) {
            console.log('No questions available.');
            return;
        }

        const externalId = questionList[ind].external_id;
        setDiff(questionList[ind].difficulty);

        const questionDetailResponse = await fetch(
            'https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-question',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': 'your-cookie-here',
                },
                body: JSON.stringify({ external_id: externalId }),
            }
        );

        const questionData = await questionDetailResponse.json();

        setStimulus(questionData.stimulus);
        setStem(questionData.stem);
        setOption1({ text: `<p class='mr-2'>A. </p>${questionData.answerOptions[0].content}`, state: 'n' });
        setOption2({ text: `<p class='mr-2'>B. </p>${questionData.answerOptions[1].content}`, state: 'n' });
        setOption3({ text: `<p class='mr-2'>C. </p>${questionData.answerOptions[2].content}`, state: 'n' });
        setOption4({ text: `<p class='mr-2'>D. </p>${questionData.answerOptions[3].content}`, state: 'n' });
        setAns(questionData.correct_answer[0]);
    } catch (error) {
        console.error('Error fetching question:', error);
        setStimulus('API connection failed. Please check your network connection and API credentials.');
        setStem('Sample Question: What is the capital of France?');
        setOption1({ text: "<p class='mr-2'>A. </p>London", state: 'n' });
        setOption2({ text: "<p class='mr-2'>B. </p>Paris", state: 'n' });
        setOption3({ text: "<p class='mr-2'>C. </p>Berlin", state: 'n' });
        setOption4({ text: "<p class='mr-2'>D. </p>Madrid", state: 'n' });
        setAns('B');
        setDiff('Sample');
    }
}

const App: React.FC = () => {
    const [question, setStem] = useState<string>('Loading...');
    const [stimulus, setStimulus] = useState<string>('Loading...');
    const [option1, setOption1] = useState<OptionState>({ text: 'Loading...', state: 'n' });
    const [option2, setOption2] = useState<OptionState>({ text: 'Loading...', state: 'n' });
    const [option3, setOption3] = useState<OptionState>({ text: 'Loading...', state: 'n' });
    const [option4, setOption4] = useState<OptionState>({ text: 'Loading...', state: 'n' });
    const [clicked, setClicked] = useState<boolean>(false);
    const [ans, setAns] = useState<string | null>(null);
    const [ind, setInd] = useState<number>(0);
    const [corr, setCorr] = useState<number>(0);
    const [option, setOption] = useState<string | null>(null);
    const [diff, setDiff] = useState<string>('null');
    const [streak, setStreak] = useState<number>(0);

    useEffect(() => {
        setStimulus('Loading...');
        setStem('Loading...');
        setOption1((prev) => ({ ...prev, text: 'Loading...' }));
        setOption2((prev) => ({ ...prev, text: 'Loading...' }));
        setOption3((prev) => ({ ...prev, text: 'Loading...' }));
        setOption4((prev) => ({ ...prev, text: 'Loading...' }));
        getNewQuestion(setStimulus, setStem, setOption1, setOption2, setOption3, setOption4, setAns, ind, setDiff);
    }, [ind]);

    const func = () => {
        if (option) {
            if (option === 'A') setOption1((prev) => ({ ...prev, state: 'i' }));
            if (option === 'B') setOption2((prev) => ({ ...prev, state: 'i' }));
            if (option === 'C') setOption3((prev) => ({ ...prev, state: 'i' }));
            if (option === 'D') setOption4((prev) => ({ ...prev, state: 'i' }));

            if (ans === 'A') setOption1((prev) => ({ ...prev, state: 'c' }));
            if (ans === 'B') setOption2((prev) => ({ ...prev, state: 'c' }));
            if (ans === 'C') setOption3((prev) => ({ ...prev, state: 'c' }));
            if (ans === 'D') setOption4((prev) => ({ ...prev, state: 'c' }));
        }
    };

    useEffect(() => {
        func();
    }, [option, ans]);

    const handleClick = (option_: string) => () => {
        if (!clicked) {
            if (option_ === ans) {
                setCorr((prev) => prev + 1);
                setStreak((prev) => prev + 1);
            } else {
                setStreak(0);
            }
            setOption(option_);
            setClicked(true);
        }
    };

    const getButtonColor = (state: string) => {
        switch (state) {
            case 'c':
                return 'bg-green-700 hover:bg-green-900';
            case 'i':
                return 'bg-red-700 hover:bg-red-900';
            default:
                return 'bg-blue-700 hover:bg-blue-900';
        }
    };

    const next = () => {
        if (clicked) {
            setClicked(false);
            setInd((prev) => prev + 1);
            setOption(null);
            setOption1((prev) => ({ ...prev, state: 'n' }));
            setOption2((prev) => ({ ...prev, state: 'n' }));
            setOption3((prev) => ({ ...prev, state: 'n' }));
            setOption4((prev) => ({ ...prev, state: 'n' }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-right mb-6 space-y-1">
                        <p className="font-bold text-gray-700">Streak: {streak}</p>
                        <p className="font-bold text-gray-700">Difficulty: {diff}</p>
                        <p className="font-bold text-gray-700">Question {ind + 1}</p>
                        <p className="font-bold text-gray-700">{corr}/{clicked ? ind + 1 : ind} correct</p>
                    </div>

                    <div className="mb-6 text-black">
                        <p className="font-bold text-gray-700 mb-4">Question:</p>
                        <div dangerouslySetInnerHTML={{ __html: stimulus }} className="mb-6 p-4 bg-gray-50 rounded" />
                        <div dangerouslySetInnerHTML={{ __html: question }} className="mb-8 text-lg font-medium" />
                    </div>

                    <div className="space-y-3 mb-6 text-white">
                        <button
                            className={`w-full border-2 border-black rounded p-4 text-white shadow-lg hover:shadow-inner text-left transition-all ${getButtonColor(option1.state)}`}
                            dangerouslySetInnerHTML={{ __html: option1.text }}
                            onClick={handleClick('A')}
                        />
                        <button
                            className={`w-full border-2 border-black rounded p-4 text-white shadow-lg hover:shadow-inner text-left transition-all ${getButtonColor(option2.state)}`}
                            dangerouslySetInnerHTML={{ __html: option2.text }}
                            onClick={handleClick('B')}
                        />
                        <button
                            className={`w-full border-2 border-black rounded p-4 text-white shadow-lg hover:shadow-inner text-left transition-all ${getButtonColor(option3.state)}`}
                            dangerouslySetInnerHTML={{ __html: option3.text }}
                            onClick={handleClick('C')}
                        />
                        <button
                            className={`w-full border-2 border-black rounded p-4 text-white shadow-lg hover:shadow-inner text-left transition-all ${getButtonColor(option4.state)}`}
                            dangerouslySetInnerHTML={{ __html: option4.text }}
                            onClick={handleClick('D')}
                        />
                    </div>

                    {clicked && (
                        <div className="text-right">
                            <button
                                onClick={next}
                                className="bg-gray-700 text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors font-medium"
                            >
                                Next Question
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
