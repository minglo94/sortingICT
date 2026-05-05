import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Code, 
  Terminal, 
  StepForward, 
  Sparkles, 
  BrainCircuit, 
  MessageSquareText,
  RefreshCw,
  GitMerge,
  ListOrdered
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('learn');
  const [algo, setAlgo] = useState('bubble'); // 'bubble', 'insertion', 'selection', 'merge'

  // Common State
  const [array, setArray] = useState([16, 8, 20, 4, 7]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPass, setCurrentPass] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [statusMessage, setStatusMessage] = useState("點擊「下一步」開始觀察排序過程");
  const [lastAction, setLastAction] = useState(""); // 'compare' or 'swap'
  
  // Algorithm specific states
  const [tempElement, setTempElement] = useState(null);
  const [insertionPos, setInsertionPos] = useState(-1);
  const [isFindingPos, setIsFindingPos] = useState(false);
  const [minIdx, setMinIdx] = useState(-1); 
  
  // Merge Sort specific states
  const [mergeSteps, setMergeSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);

  // Gemini AI States
  const [aiExplanation, setAiExplanation] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Challenge State
  const [challengeOriginal, setChallengeOriginal] = useState([8, 18, 12, 15, 1, 3]);
  const [challengeInputs, setChallengeInputs] = useState({
    pass1: ["", "", "", "", "", ""],
    pass2: ["", "", "", "", "", ""],
    pass3: ["", "", "", "", "", ""],
    pass4: ["", "", "", "", "", ""],
    pass5: ["", "", "", "", "", ""],
  });
  
  const [expectedAnswers, setExpectedAnswers] = useState({
    pass1: [8, 12, 15, 1, 3, 18],
    pass2: [8, 12, 1, 3, 15, 18],
    pass3: [8, 1, 3, 12, 15, 18],
    pass4: [1, 3, 8, 12, 15, 18],
    pass5: [1, 3, 8, 12, 15, 18],
  });
  const [results, setResults] = useState({});

  useEffect(() => {
    resetSort();
    // 切換演算法時，重置挑戰題目的預設答案 (這裡以預設的 [8, 18, 12, 15, 1, 3] / 合併排序為例作示範，若有 AI 換題則可覆蓋)
    setChallengeOriginal(algo === 'merge' ? [8, 18, 12, 7, 15, 1, 3] : [8, 18, 12, 15, 1, 3]);
    setChallengeInputs({
      pass1: ["", "", "", "", "", "", ""], pass2: ["", "", "", "", "", "", ""],
      pass3: ["", "", "", "", "", "", ""], pass4: ["", "", "", "", "", "", ""],
      pass5: ["", "", "", "", "", "", ""]
    });
    setResults({});
  }, [algo]);

  // Exponential Backoff Helper
  const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('API Error');
      return await response.json();
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw err;
    }
  };

  const getAiExplanation = async () => {
    setIsAiLoading(true);
    const prompt = `目前的陣列是 [${array.join(', ')}]。正在使用 ${algo} 排序進行第 ${currentPass + 1} 輪，比較或掃描相關索引。請用簡短、活潑的語氣解釋當前動作的原因，並告訴學生這對整體排序有什麼意義。限 50 字以內。`;
    
    try {
      const data = await fetchWithRetry('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model: 'gemini-2.0-flash' })
        });
      setAiExplanation(data.text || "AI 暫時無法回應。");
    } catch (error) {
      setAiExplanation("AI 助手忙碌中，請稍後再試。");
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateNewChallenge = async () => {
    setIsAiLoading(true);
    const prompt = `請生成 6 個介於 1 到 50 之間的隨機不重複整數作為「${algo}排序」挑戰題。並請以 JSON 格式返回，包含 'original' (原始數組) 和 'passes' (一個包含 5 個數組的物件，鍵名為 pass1 到 pass5，分別代表每一輪${algo}排序後的結果)。`;
    
    try {
      const data = await fetchWithRetry('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model: 'gemini-2.5-flash-preview-09-2025', generationConfig: { responseMimeType: 'application/json' } })
        });
      
      const res = JSON.parse(data.text);
      setChallengeOriginal(res.original);
      setExpectedAnswers(res.passes);
      setChallengeInputs({
        pass1: ["", "", "", "", "", ""], pass2: ["", "", "", "", "", ""],
        pass3: ["", "", "", "", "", ""], pass4: ["", "", "", "", "", ""],
        pass5: ["", "", "", "", "", ""],
      });
      setResults({});
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const resetSort = () => {
    let initialArray;
    if (algo === 'selection') initialArray = [16, 10, 7, 5, 8];
    else if (algo === 'merge') initialArray = [16, 5, 10, 2, 20, 4, 7, 18];
    else initialArray = [16, 8, 20, 4, 7];

    setArray(initialArray);
    setCurrentIndex(algo === 'bubble' ? 0 : algo === 'selection' ? 1 : 1);
    setCurrentPass(0);
    setMinIdx(algo === 'selection' ? 0 : -1);
    setInsertionPos(algo === 'insertion' ? 1 : -1);
    setTempElement(null);
    setIsComplete(false);
    setIsFindingPos(false);
    setStepIdx(0);
    setLastAction("");
    setAiExplanation("");
    
    if (algo === 'merge') {
      const steps = [
        { arr: [16, 5, 10, 2, 20, 4, 7, 18], msg: "開始合併排序：原始陣列 [16, 5, 10, 2, 20, 4, 7, 18]", highlight: [] },
        { arr: [16, 5, 10, 2, 20, 4, 7, 18], msg: "分割成左右兩半：[16, 5, 10, 2] 和 [20, 4, 7, 18]", highlight: [0, 1, 2, 3] },
        { arr: [16, 5, 10, 2, 20, 4, 7, 18], msg: "繼續分割左半部：[16, 5] 和 [10, 2]", highlight: [0, 1] },
        { arr: [5, 16, 10, 2, 20, 4, 7, 18], msg: "合併 [16] 和 [5]：結果為 [5, 16]", highlight: [0, 1] },
        { arr: [5, 16, 2, 10, 20, 4, 7, 18], msg: "合併 [10] 和 [2]：結果為 [2, 10]", highlight: [2, 3] },
        { arr: [2, 5, 10, 16, 20, 4, 7, 18], msg: "合併已排序的 [5, 16] 和 [2, 10]：結果為 [2, 5, 10, 16]", highlight: [0, 1, 2, 3] },
        { arr: [2, 5, 10, 16, 4, 20, 7, 18], msg: "處理右半部，合併 [20] 和 [4]：結果為 [4, 20]", highlight: [4, 5] },
        { arr: [2, 5, 10, 16, 4, 20, 7, 18], msg: "合併 [7] 和 [18]：結果為 [7, 18]", highlight: [6, 7] },
        { arr: [2, 5, 10, 16, 4, 7, 18, 20], msg: "合併 [4, 20] 和 [7, 18]：結果為 [4, 7, 18, 20]", highlight: [4, 5, 6, 7] },
        { arr: [2, 4, 5, 7, 10, 16, 18, 20], msg: "最後合併：[2, 5, 10, 16] 和 [4, 7, 18, 20]，完成排序！", highlight: [0, 1, 2, 3, 4, 5, 6, 7] }
      ];
      setMergeSteps(steps);
      setStatusMessage(steps[0].msg);
    } else {
      setStatusMessage("已重置。點擊「下一步」重新開始。");
    }
  };

  const handleBubbleStep = () => {
    let newArray = [...array];
    let n = newArray.length;
    let p = currentPass;
    let j = currentIndex;
    if (p >= n - 1) { setIsComplete(true); return; }
    if (newArray[j] > newArray[j + 1]) {
      [newArray[j], newArray[j + 1]] = [newArray[j + 1], newArray[j]];
      setArray(newArray);
      setLastAction("swap");
      setStatusMessage(`交換：${newArray[j+1]} > ${newArray[j]}，位置對調。`);
    } else {
      setLastAction("compare");
      setStatusMessage(`不變：${newArray[j]} <= ${newArray[j+1]}。`);
    }
    let nextJ = j + 1;
    let nextP = p;
    if (nextJ >= n - p - 1) { nextJ = 0; nextP = p + 1; if (nextP >= n - 1) { setIsComplete(true); setStatusMessage("排序完成！"); } }
    setCurrentIndex(nextJ);
    setCurrentPass(nextP);
    setAiExplanation(""); 
  };

  const handleInsertionStep = () => {
    let newArray = [...array];
    let n = newArray.length;
    let i = currentPass + 1; 
    let j = insertionPos;
    if (i >= n && !isFindingPos) { setIsComplete(true); setStatusMessage("排序完成！"); return; }
    if (!isFindingPos) {
      setTempElement(newArray[i]);
      setIsFindingPos(true);
      setStatusMessage(`選取未排序部分的第 1 個元素：${newArray[i]}`);
      return;
    }
    if (j > 0 && tempElement < newArray[j - 1]) {
      newArray[j] = newArray[j - 1];
      setArray(newArray);
      setInsertionPos(j - 1);
      setStatusMessage(`移動：${newArray[j-1]} 比 ${tempElement} 大，向後移一位。`);
    } else {
      newArray[j] = tempElement;
      setArray(newArray);
      setStatusMessage(`插入：將 ${tempElement} 放到正確位置 [${j}]。`);
      const nextPass = currentPass + 1;
      setCurrentPass(nextPass);
      setInsertionPos(nextPass + 1);
      setIsFindingPos(false);
      setTempElement(null);
      if (nextPass >= n - 1) { setIsComplete(true); setStatusMessage("排序完成！"); }
    }
    setAiExplanation(""); 
  };

  const handleSelectionStep = () => {
    let newArray = [...array];
    let n = newArray.length;
    let p = currentPass;
    let j = currentIndex;
    if (p >= n - 1) { setIsComplete(true); setStatusMessage("排序完成！"); return; }
    if (j < n) {
      if (newArray[j] < newArray[minIdx]) setMinIdx(j);
      setCurrentIndex(j + 1);
      setStatusMessage(`掃描：尋找剩餘部分的最小值... 目前是 ${newArray[minIdx]}`);
    } else {
      if (minIdx !== p) {
        [newArray[p], newArray[minIdx]] = [newArray[minIdx], newArray[p]];
        setArray(newArray);
      }
      const nextPass = p + 1;
      setCurrentPass(nextPass);
      setCurrentIndex(nextPass + 1);
      setMinIdx(nextPass);
      setStatusMessage(`交換：將找到的最小值放在位置 [${p}]`);
      if (nextPass >= n - 1) { setIsComplete(true); setStatusMessage("排序完成！"); }
    }
    setAiExplanation(""); 
  };

  const handleMergeStep = () => {
    const nextIdx = stepIdx + 1;
    if (nextIdx < mergeSteps.length) {
      setStepIdx(nextIdx);
      setArray(mergeSteps[nextIdx].arr);
      setStatusMessage(mergeSteps[nextIdx].msg);
      if (nextIdx === mergeSteps.length - 1) setIsComplete(true);
    }
    setAiExplanation(""); 
  };

  const handleInputChange = (pass, index, value) => {
    const newInputs = { ...challengeInputs };
    newInputs[pass][index] = value;
    setChallengeInputs(newInputs);
  };

  const checkPass = (passKey) => {
    const userAns = challengeInputs[passKey].map(v => parseInt(v));
    const correctAns = expectedAnswers[passKey] || [];
    // Only check the valid length based on algorithm (merge might be different, but sticking to 6 for standard)
    const slicedUserAns = userAns.slice(0, correctAns.length);
    const isCorrect = JSON.stringify(slicedUserAns) === JSON.stringify(correctAns);
    setResults({ ...results, [passKey]: isCorrect });
  };

  const getStepHandler = () => {
    if (algo === 'bubble') return handleBubbleStep;
    if (algo === 'insertion') return handleInsertionStep;
    if (algo === 'selection') return handleSelectionStep;
    return handleMergeStep;
  };

  // 控制當前是否要對代碼進行高亮追蹤 (挑戰模式中不顯示即時高亮，避免干擾)
  const isHighlighting = activeTab === 'learn' && !isComplete;

  // Python Code Dictionary
  const pythonCodeDict = {
    bubble: `def bubble_sort(arr):
    n = len(arr)
    for pass_num in range(n-1):
        for j in range(0, n-pass_num-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]`,
    insertion: `def insertion_sort(arr):
    n = len(arr)
    for pass_num in range(1, n):
        element = arr[pass_num]
        pos = pass_num
        while pos > 0 and element < arr[pos - 1]:
            arr[pos] = arr[pos - 1]
            pos -= 1
        arr[pos] = element`,
    selection: `def selection_sort(arr):
    n = len(arr)
    for pass_num in range(n-1):
        min_idx = pass_num
        for j in range(pass_num+1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != pass_num:
            arr[pass_num], arr[min_idx] = arr[min_idx], arr[pass_num]`,
    merge: `def merge_sort(arr):
    if len(arr) > 1:
        mid = len(arr) // 2
        L = arr[:mid]
        R = arr[mid:]

        merge_sort(L)
        merge_sort(R)

        i = j = k = 0
        while i < len(L) and j < len(R):
            if L[i] < R[j]:
                arr[k] = L[i]; i += 1
            else:
                arr[k] = R[j]; j += 1
            k += 1

        while i < len(L):
            arr[k] = L[i]; i += 1; k += 1
        while j < len(R):
            arr[k] = R[j]; j += 1; k += 1`
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Algorithm Selector */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">排序算法互動教學</h1>
            <p className="text-slate-500">視覺化演示與 AI 智能輔助練習</p>
          </div>
          <div className="flex bg-white rounded-xl shadow-sm border p-1 overflow-x-auto max-w-full">
            {['bubble', 'insertion', 'selection', 'merge'].map(a => (
              <button 
                key={a}
                onClick={() => setAlgo(a)}
                className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${algo === a ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {a === 'bubble' ? '冒泡' : a === 'insertion' ? '插入' : a === 'selection' ? '選擇' : '合併'}排序
              </button>
            ))}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-8 gap-4">
          <button 
            onClick={() => setActiveTab('learn')}
            className={`px-6 py-2 rounded-full border-2 flex items-center gap-2 font-bold transition-all ${activeTab === 'learn' ? 'bg-white border-indigo-600 text-indigo-700 shadow-md' : 'border-transparent text-slate-400'}`}
          >
            <BookOpen size={18} /> Part 1: 原理演示
          </button>
          <button 
            onClick={() => setActiveTab('challenge')}
            className={`px-6 py-2 rounded-full border-2 flex items-center gap-2 font-bold transition-all ${activeTab === 'challenge' ? 'bg-white border-indigo-600 text-indigo-700 shadow-md' : 'border-transparent text-slate-400'}`}
          >
            <Terminal size={18} /> Part 2: 實戰練習
          </button>
        </div>

        {/* Main Layout: Split Content and Code Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Dynamic Content (Visualization OR Challenge) */}
          <div className="lg:col-span-7 space-y-6">
            
            {activeTab === 'learn' ? (
              // ---------------- PART 1: 視覺化演示 ----------------
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <StepForward className="text-indigo-600" size={20} /> 單步演示
                  </h2>
                  <div className="text-sm font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                    {algo === 'merge' ? `步驟: ${stepIdx + 1} / ${mergeSteps.length}` : `第 ${currentPass + 1} 輪 / 索引 ${currentIndex}`}
                  </div>
                </div>
                
                <div className="flex justify-center items-end gap-2 h-48 mb-8 border-b border-slate-100 pb-4 overflow-x-auto">
                  {array.map((val, idx) => {
                    let colorClass = "bg-indigo-400";
                    let isTarget = false;

                    if (algo === 'bubble') {
                      if (!isComplete && (idx === currentIndex || idx === currentIndex + 1)) { colorClass = "bg-orange-500 scale-105 ring-4 ring-orange-200"; isTarget = true; }
                      if (idx >= array.length - currentPass) colorClass = "bg-emerald-500";
                    } else if (algo === 'insertion') {
                      if (idx <= currentPass) colorClass = "bg-emerald-400"; 
                      if (idx === currentPass + 1 && !isFindingPos) colorClass = "bg-yellow-500 scale-110 ring-2 ring-yellow-200";
                      if (isFindingPos && idx === insertionPos) { colorClass = "bg-orange-500 scale-110 ring-4 ring-orange-200"; isTarget = true; }
                    } else if (algo === 'selection') {
                      if (idx < currentPass) colorClass = "bg-emerald-500";
                      if (idx === currentIndex) { colorClass = "bg-blue-400 scale-105 ring-2 ring-blue-200"; isTarget = true; }
                      if (idx === minIdx) colorClass = "bg-orange-500 scale-110 ring-2 ring-orange-300 font-bold";
                    } else if (algo === 'merge') {
                      if (mergeSteps[stepIdx]?.highlight.includes(idx)) { colorClass = "bg-orange-500 scale-105 shadow-md"; isTarget = true; }
                    }

                    if (isComplete) colorClass = "bg-emerald-500";

                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 flex-1 min-w-[35px]">
                        <div 
                          className={`w-full max-w-[48px] flex items-center justify-center rounded-t-lg font-bold text-white transition-all duration-300 ${colorClass}`}
                          style={{ height: `${val * 6}px` }}
                        >
                          {val}
                        </div>
                        <span className={`text-xs font-mono ${isTarget ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                          {isTarget ? '↑' : `[${idx}]`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-4">
                  <div className={`p-4 rounded-xl border-l-4 transition-all bg-slate-50 border-indigo-500`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">執行狀態</p>
                      {!isComplete && (
                        <button 
                          onClick={getAiExplanation}
                          disabled={isAiLoading}
                          className="text-xs flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
                        >
                          {isAiLoading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          ✨ AI 助教解釋
                        </button>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium min-h-[40px]">{statusMessage}</p>
                    
                    {aiExplanation && (
                      <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-1">
                          <BrainCircuit size={14} /> AI 深度解說
                        </div>
                        <p className="text-sm text-indigo-900 italic">「{aiExplanation}」</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={getStepHandler()}
                      disabled={isComplete}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                      <StepForward size={20} /> 下一步
                    </button>
                    <button 
                      onClick={resetSort}
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 flex items-center gap-2 font-medium transition-all"
                    >
                      <RotateCcw size={18} /> 重置
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // ---------------- PART 2: 實戰挑戰 ----------------
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-6 p-5 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-indigo-800 mb-2">
                      挑戰：預測 {algo === 'bubble' ? '冒泡' : algo === 'insertion' ? '插入' : algo === 'selection' ? '選擇' : '合併'} 排序結果
                    </h2>
                    <p className="text-indigo-600 mb-4 text-sm">
                      {algo === 'merge' ? "請注意合併時降序/升序的邏輯要求。" : "寫下每一輪「Pass」完成後的數列順序。"} 
                      <span className="hidden md:inline">👉 右側有代碼可以參考！</span>
                    </p>
                    <div className="flex gap-2 items-center overflow-x-auto pb-2">
                      <span className="font-bold whitespace-nowrap text-slate-700 text-sm">原始列表：</span>
                      {challengeOriginal.map((v, i) => (
                        <div key={i} className="min-w-[32px] h-8 flex items-center justify-center bg-white border border-indigo-200 rounded font-bold text-indigo-700 text-sm">
                          {v}
                        </div>
                      ))}
                    </div>
                  </div>
                  {algo !== 'merge' && (
                    <div className="shrink-0 flex items-start md:items-center">
                      <button 
                        onClick={generateNewChallenge}
                        disabled={isAiLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 text-sm"
                      >
                        {isAiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        AI 換題
                      </button>
                    </div>
                  )}
                </div>

                {algo === 'merge' ? (
                  // 合併排序專用挑戰佈局 (來自作業 6-15)
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                      <h3 className="font-bold text-emerald-600 mb-3">最終合併 (降序)</h3>
                      <p className="text-sm mb-3">假設已完成分割，正將兩組「降序」排好的陣列合併：</p>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white rounded border text-sm font-bold">[18, 12, 8, 7]</div>
                        <span>+</span>
                        <div className="p-2 bg-white rounded border text-sm font-bold">[15, 3, 1]</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[0, 1, 2, 3, 4, 5, 6].map(i => (
                          <input
                            key={i} type="number" placeholder="?"
                            className="w-10 h-10 text-center border-2 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none font-bold"
                            onChange={(e) => handleInputChange('pass1', i, e.target.value)}
                          />
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          const correct = [18, 15, 12, 8, 7, 3, 1];
                          const user = challengeInputs.pass1.slice(0,7).map(v => parseInt(v));
                          setResults({...results, mergeFinal: JSON.stringify(user) === JSON.stringify(correct)});
                        }}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg font-bold hover:bg-emerald-700 transition-all"
                      >
                        檢查合併結果
                      </button>
                      {results.mergeFinal !== undefined && (
                        <span className={`ml-3 font-bold text-sm ${results.mergeFinal ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {results.mergeFinal ? "✓ 正確！" : "✗ 請再檢查降序邏輯。"}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  // 一般排序 (冒泡/插入/選擇) 的逐輪挑戰
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((passNum) => {
                      const passKey = `pass${passNum}`;
                      return (
                        <div key={passNum} className="flex flex-wrap items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                          <div className="w-20 md:w-24 font-bold text-slate-700 text-sm">
                            第 {passNum} 輪：
                          </div>
                          <div className="flex gap-1.5">
                            {challengeOriginal.map((_, idx) => (
                              <input
                                key={idx}
                                type="number"
                                value={challengeInputs[passKey][idx] || ""}
                                onChange={(e) => handleInputChange(passKey, idx, e.target.value)}
                                className={`w-9 h-9 md:w-10 md:h-10 text-center border-2 rounded-md focus:ring-2 focus:outline-none transition-all font-bold text-sm ${
                                  results[passKey] === true ? 'border-emerald-500 bg-emerald-50' : 
                                  results[passKey] === false ? 'border-rose-300 bg-rose-50' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                                }`}
                                placeholder="?"
                              />
                            ))}
                          </div>
                          <button 
                            onClick={() => checkPass(passKey)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-all active:scale-95 ml-auto md:ml-0"
                          >
                            檢查
                          </button>
                          {results[passKey] !== undefined && (
                            <div className="flex items-center">
                              {results[passKey] ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-rose-500" />}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Code Tracking (Always Visible) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Pseudo Code Panel */}
            <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl shadow-lg font-mono text-sm overflow-hidden border-t-4 border-indigo-500">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                <Code size={16} className="text-indigo-400" />
                <span className="font-bold text-white">
                  {algo === 'bubble' ? '冒泡' : algo === 'insertion' ? '插入' : algo === 'selection' ? '選擇' : '合併'} 偽代碼
                </span>
                {activeTab === 'challenge' && <span className="ml-auto text-xs text-indigo-400 opacity-70">💡 參考用</span>}
              </div>
              
              <div className="space-y-1">
                {/* 冒泡排序偽代碼 */}
                {algo === 'bubble' && (
                  <>
                    <div className={isHighlighting ? 'text-white bg-indigo-900/50 px-2 -mx-2 rounded font-semibold' : ''}>for pass = 1 to N-1: <span className="text-slate-500 ml-2"># 第 {currentPass + 1} 輪</span></div>
                    <div className={isHighlighting ? 'text-white bg-indigo-900/60 pl-4 px-2 -mx-2 rounded font-semibold' : 'pl-4'}>for J = 0 to (N-pass-1): <span className="text-slate-500 ml-2"># J = {currentIndex}</span></div>
                    <div className={`pl-8 px-2 -mx-2 rounded ${isHighlighting && lastAction === 'swap' ? 'text-orange-400 bg-orange-900/30' : ''}`}>if array[J] &gt; array[J+1]:</div>
                    <div className={`pl-12 px-2 -mx-2 rounded ${isHighlighting && lastAction === 'swap' ? 'text-orange-400 font-bold underline' : ''}`}>swap(array[J], array[J+1])</div>
                  </>
                )}

                {/* 插入排序偽代碼 */}
                {algo === 'insertion' && (
                  <>
                    <div className={isHighlighting ? 'text-white bg-indigo-900/50 px-2 -mx-2 rounded font-semibold' : ''}>for pass = 1 to N-1: <span className="text-slate-500 ml-2"># 處理索引 {currentPass + 1}</span></div>
                    <div className={isHighlighting && isFindingPos ? 'text-orange-400 bg-orange-900/30 pl-4 px-2 -mx-2 rounded' : 'pl-4'}>element = array[pass]</div>
                    <div className="pl-4">pos = pass</div>
                    <div className="pl-4">while pos &gt; 0 and element &lt; array[pos-1]:</div>
                    <div className={`pl-8 ${isHighlighting && insertionPos !== -1 && !isFindingPos ? 'text-indigo-300' : ''}`}>array[pos] = array[pos-1]</div>
                    <div className="pl-8">pos = pos - 1</div>
                    <div className="pl-4">array[pos] = element <span className="text-slate-500 ml-2"># 插入</span></div>
                  </>
                )}

                {/* 選擇排序偽代碼 */}
                {algo === 'selection' && (
                  <>
                    <div className={isHighlighting ? 'text-white bg-indigo-900/50 px-2 -mx-2 rounded font-semibold' : ''}>for pass = 0 to N-2: <span className="text-slate-500 ml-2"># 目標位置 {currentPass}</span></div>
                    <div className="pl-4">min_idx = pass</div>
                    <div className={isHighlighting ? 'text-white bg-indigo-900/60 pl-4 px-2 -mx-2 rounded' : 'pl-4'}>for J = pass+1 to N-1: <span className="text-slate-500 ml-2"># 掃描尋找最小值</span></div>
                    <div className="pl-8">if array[J] &lt; array[min_idx]:</div>
                    <div className="pl-12 text-orange-400">min_idx = J</div>
                    <div className="pl-4">if min_idx != pass:</div>
                    <div className="pl-8 text-emerald-400">swap(array[min_idx], array[pass])</div>
                  </>
                )}

                {/* 合併排序偽代碼 */}
                {algo === 'merge' && (
                  <>
                    <div className="text-indigo-300">def merge_sort(arr):</div>
                    <div className="pl-4">if length of arr &gt; 1:</div>
                    <div className="pl-8">mid = length of arr // 2</div>
                    <div className="pl-8">L = arr[0 to mid]</div>
                    <div className="pl-8">R = arr[mid to end]</div>
                    <div className="pl-8 text-emerald-400">merge_sort(L) <span className="text-slate-500 ml-2"># 遞歸左半部</span></div>
                    <div className="pl-8 text-emerald-400">merge_sort(R) <span className="text-slate-500 ml-2"># 遞歸右半部</span></div>
                    <div className="pl-8 text-orange-400">merge(arr, L, R) <span className="text-slate-500 ml-2"># 合併排序</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Python Code Panel */}
            <div className="bg-slate-900 rounded-2xl p-5 text-emerald-400 font-mono text-sm border-t-4 border-emerald-500 shadow-xl overflow-x-auto">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                <Code size={16} className="text-emerald-500" /> 
                <span className="font-bold text-white">Python 實作</span>
              </div>
              <pre className="text-emerald-50 text-xs leading-relaxed">
                {pythonCodeDict[algo]}
              </pre>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
