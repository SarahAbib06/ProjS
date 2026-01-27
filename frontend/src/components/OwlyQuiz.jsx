import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import clickSound from "../assets/sounds/click.wav";
import winSound from "../assets/sounds/win.wav";
import loseSound from "../assets/sounds/lose.wav";
import { IoArrowBackOutline } from "react-icons/io5";

import { useTranslation } from "react-i18next";

const OWLY_IMAGE = "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=60";
const MEMORY_ICONS = ["🌿", "🌸", "⭐", "🐦"];




const PUZZLE_PIECES = [
  { id: 0, order: 0 },
  { id: 1, order: 1 },
  { id: 2, order: 2 },
  { id: 3, order: 3 },
  { id: 4, order: 4 },
  { id: 5, order: 5 }
];

function playSound(sound) {
    

  try { const a = new Audio(sound); a.volume = 0.75; a.play().catch(()=>{}); } catch(e){}
}

function arraysEqual(a, b){
  if(a.length!==b.length) return false;
  for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false;
  return true;
}

function shuffleArray(arr){ return [...arr].sort(()=>Math.random()-0.5); }

function pieceBgPos(idx){
  switch(idx){
    case 0: return "0% 0%";
    case 1: return "50% 0%";
    case 2: return "100% 0%";
    case 3: return "0% 50%";
    case 4: return "50% 50%";
    case 5: return "100% 50%";
    default: return "0% 0%";
  }
}

export default function OwlyQuiz(){
  const { t } = useTranslation();
   const STORY_PARAGRAPHS = t("owlyQuiz.story", { returnObjects: true });
const STORY_SUMMARY = t("owlyQuiz.storySummary", { returnObjects: true });
  const navigate = useNavigate();
  const [stage,setStage]=useState("intro");
  const [storyIndex,setStoryIndex]=useState(0);
  const [challengeType,setChallengeType]=useState(null);

  const [pieces,setPieces]=useState(shuffleArray(PUZZLE_PIECES));
  const [selected,setSelected]=useState(null);
  const [timer,setTimer]=useState(15);
  const timerRef=useRef(null);

  const [memorySeq,setMemorySeq]=useState([]);
  const [playerSeq,setPlayerSeq]=useState([]);
  const [memoryButtons,setMemoryButtons]=useState([]);

  const [ballPos,setBallPos]=useState(0);
  const [cups,setCups]=useState([false,false,false]);
  const [ballVisible,setBallVisible]=useState(true);

  const [obsGrid,setObsGrid] = useState([]);
  const [obsQuestion,setObsQuestion] = useState(null);
  const [obsOptions,setObsOptions] = useState([]);
  const [showGrid,setShowGrid] = useState(true);

  const [finalQues,setFinalQues]=useState({question:"Que symbolise Owly dans l’histoire ?",options:["Pouvoir", "Connexion", "Richesse", "Secret"],correct:2});

  const [windowWidth,setWindowWidth] = useState(window.innerWidth);

  useEffect(()=>{
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return ()=> window.removeEventListener("resize", handleResize);
  },[]);

  const getPuzzleSize = () => {
    if(windowWidth >= 1024) return 100;
    if(windowWidth >= 768) return 80;
    return 60;
  };

  const startChallenge=()=>{
    playSound(clickSound);
    setSelected(null);
    setPlayerSeq([]);
    setBallVisible(true);

    const types=["puzzle","memory","cups","obsChallenge","finalPuzzle"];
    const type=types[storyIndex] || "finalPuzzle";
    setChallengeType(type);

    if(type==="puzzle"){
      setPieces(shuffleArray(PUZZLE_PIECES));
      setTimer(15);
      if(timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(()=>{
        setTimer(prev=>{
          if(prev<=1){ clearInterval(timerRef.current); onFail(); return 0; }
          return prev-1;
        });
      },1000);
    }

    if(type==="memory"){
      const seq = shuffleArray(MEMORY_ICONS);
      setMemorySeq(seq);
      setPlayerSeq(seq);
      setMemoryButtons(shuffleArray(seq));
      setTimeout(()=>setPlayerSeq([]),2000);
    }

    if(type==="cups"){
      const idx=Math.floor(Math.random()*3);
      setBallPos(idx);
      const arr=[false,false,false];
      arr[idx]=true;
      setCups(arr);
      setBallVisible(true);
      setTimeout(()=>{
        let moves=0;
        const interval=setInterval(()=>{
          if(moves>=3){ clearInterval(interval); setBallVisible(false); setCups([false,false,false]); }
          else{
            let i=Math.floor(Math.random()*3);
            let j=Math.floor(Math.random()*3);
            while(i===j) j=Math.floor(Math.random()*3);
            const newArr=[...arr];
            [newArr[i],newArr[j]]=[newArr[j],newArr[i]];
            setCups(newArr);
            moves++;
          }
        },800);
      },1000);
    }

    if(type==="obsChallenge"){
      const gridSize = 2;
      const icons = shuffleArray(MEMORY_ICONS).slice(0, gridSize*gridSize);
      setObsGrid(icons);
      setShowGrid(true);

      const qIndex = Math.floor(Math.random() * icons.length);
      setObsQuestion({index: qIndex, icon: icons[qIndex]});

      const options = [icons[qIndex]];
      while(options.length < 4){
        const randIcon = MEMORY_ICONS[Math.floor(Math.random()*MEMORY_ICONS.length)];
        if(!options.includes(randIcon)) options.push(randIcon);
      }
      setObsOptions(shuffleArray(options));

      setTimeout(()=>setShowGrid(false), 3000);
    }

    if(type==="finalPuzzle"){
       setFinalQues({
    question: t("owlyQuiz.final.question"),
    options: shuffleArray(t("owlyQuiz.final.options", { returnObjects: true })),
    correct: 2
  });
    }

    setStage("challenge");
  };

  const onPieceClick=(idx)=>{
    if(challengeType!=="puzzle" && challengeType!=="finalPuzzle") return;
    if(selected===null){ setSelected(idx); return;}
    if(selected===idx){ setSelected(null); return;}
    const newPieces=[...pieces];
    [newPieces[selected],newPieces[idx]]=[newPieces[idx],newPieces[selected]];
    setPieces(newPieces);
    setSelected(null);
    if(newPieces.every((p,i)=>p.order===i)) onWin();
  };

  const onMemoryClick=(s)=>{
    if(challengeType!=="memory") return;
    const next=[...playerSeq,s];
    setPlayerSeq(next);
    const expected=memorySeq.slice(0,next.length);
    if(!arraysEqual(next,expected)) onFail();
    else if(next.length===memorySeq.length) onWin();
  };

  const onCupClick=(i)=>{
    if(challengeType!=="cups") return;
    if(i===ballPos) onWin(); else onFail();
  };

  const onFinalClick=(i)=>{
    if(challengeType!=="finalPuzzle") return;
    if(i===finalQues.correct) onWin(); else onFail();
  };

 const onWin = () => {
  playSound(winSound);
  if (timerRef.current) clearInterval(timerRef.current);

  // Si c’est le dernier paragraphe
  if (storyIndex + 1 >= STORY_PARAGRAPHS.length) {
    setStage("finished");
  } else {
    setStage("story");
    setStoryIndex(prev => prev + 1);
  }
};
  const onFail=()=>{
    playSound(loseSound);
    if(timerRef.current) clearInterval(timerRef.current);
    setStage("lost");
  };

  const nextStage=()=>{ if(storyIndex>=STORY_PARAGRAPHS.length) setStage("finished"); else startChallenge(); };
  const resetGame=()=>{ setStage("intro"); setStoryIndex(0); };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return(
    <div className="min-h-screen bg-[#FFFF99] p-4 sm:p-6 lg:p-8 text-black flex flex-col items-center relative overflow-hidden">
      
      {/* Fond animé */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-amber-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-amber-500 rounded-full blur-3xl"
        />
      </div>

      {/* Bouton retour */}
      <motion.button
        onClick={() => navigate("/games")}
        whileTap={{ scale: 0.95 }}
        className="
          fixed top-4 left-4 z-50
          px-4 sm:px-6 py-2 sm:py-3
          bg-[#ffd54f] rounded-xl
          font-bold text-sm sm:text-base
          shadow-lg shadow-black/20
          hover:shadow-xl hover:shadow-black/30
          transition-all duration-300
        "
      >
        ⬅ Retour
      </motion.button>

      {/* Titre */}
      <motion.h1 
        initial={{ y: -50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-16 mb-8 text-center relative z-10"
      >
        <motion.span
          animate={{
            rotate: [0, -10, 10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
          className="inline-block"
        >
          🦉
        </motion.span>
        {" "}Owly Quiz{" "}
        <motion.span
          animate={{
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
          className="inline-block"
        >
          🦉
        </motion.span>
      </motion.h1>

      {/* INTRO */}
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-2xl w-full text-center mt-8 p-6 sm:p-8 bg-white rounded-2xl shadow-2xl relative z-10"
          >
            <p variants={itemVariants} className="text-base sm:text-lg mb-6 leading-relaxed">
              Ce jeu raconte l'histoire d'Owly. Pour la découvrir, réussis chaque défi.
            </p>
            <button 
              variants={itemVariants}
              onClick={startChallenge}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-xl bg-[#ffd54f] border-none font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Commencer l'aventure
            </button>
          </div>
        )}

        {/* PUZZLE */}
        {stage === "challenge" && challengeType === "puzzle" && (
          <div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mt-8 relative z-10 w-full flex flex-col items-center"
          >
            <div variants={itemVariants} className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Puzzle — reconstitue l'image</h2>
              <div 
                className="inline-block px-6 py-2 bg-white rounded-full shadow-lg"
                animate={{
                  scale: timer <= 5 ? [1, 1.1, 1] : 1
                }}
                transition={{
                  duration: 0.5,
                  repeat: timer <= 5 ? Infinity : 0
                }}
              >
                <span className={`text-2xl font-bold ${timer <= 5 ? 'text-red-600' : 'text-black'}`}>
                  ⏱️ {timer}s
                </span>
              </div>
            </div>
            
            <div 
              variants={itemVariants}
              className="grid gap-2 sm:gap-3"
              style={{
                gridTemplateColumns: `repeat(3, ${getPuzzleSize()}px)`,
                gridTemplateRows: `repeat(2, ${getPuzzleSize()}px)`
              }}
            >
              {pieces.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => onPieceClick(idx)}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    cursor-pointer rounded-lg
                    ${selected === idx ? 'ring-4 ring-[#ffd54f]' : 'ring-2 ring-black'}
                  `}
                  style={{
                    width: getPuzzleSize(),
                    height: getPuzzleSize(),
                    backgroundImage: `url(${OWLY_IMAGE})`,
                    backgroundSize: "300% 200%",
                    backgroundPosition: pieceBgPos(p.order)
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* MEMORY */}
        {stage === "challenge" && challengeType === "memory" && (
          <div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center mt-8 relative z-10 w-full max-w-2xl px-4"
          >
            <h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-6">
              Défi mémoire
            </h2>
            <div variants={itemVariants} className="text-4xl sm:text-5xl mb-8 bg-white p-6 rounded-2xl shadow-xl">
              {playerSeq.length > 0 ? playerSeq.join(" ") : memorySeq.map(() => "❓").join(" ")}
            </div>
            <div variants={itemVariants} className="flex flex-wrap gap-3 sm:gap-4 justify-center">
              {memoryButtons.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onMemoryClick(s)}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 sm:px-8 py-3 sm:py-4 text-3xl sm:text-4xl rounded-xl bg-[#ffd54f] shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CUPS */}
        {stage === "challenge" && challengeType === "cups" && (
          <div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center mt-8 relative z-10 w-full max-w-2xl px-4"
          >
            <h2 variants={itemVariants} className="text-xl sm:text-2xl lg:text-3xl font-bold mb-8">
              Défi rapidité & logique — Trouve la boule !
            </h2>
            <div variants={itemVariants} className="flex gap-4 sm:gap-6 justify-center">
              {cups.map((c, i) => (
                <div
                  key={i}
                  onClick={() => onCupClick(i)}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white rounded-2xl border-4 border-black flex items-center justify-center cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 text-3xl sm:text-4xl"
                  style={{
                    width: getPuzzleSize(),
                    height: getPuzzleSize()
                  }}
                >
                  {ballVisible && c ? "⚪" : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OBSERVATION */}
        {stage === "challenge" && challengeType === "obsChallenge" && (
          <div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center mt-8 relative z-10 w-full max-w-2xl px-4"
          >
            <h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-8">
              Défi d'observation visuelle
            </h2>
            {showGrid ? (
              <div 
                variants={itemVariants}
                className="grid gap-3 sm:gap-4 justify-center"
                style={{
                  gridTemplateColumns: `repeat(2, ${getPuzzleSize()}px)`
                }}
              >
                {obsGrid.map((icon, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border-4 border-black flex items-center justify-center shadow-xl"
                    style={{
                      width: getPuzzleSize(),
                      height: getPuzzleSize(),
                      fontSize: getPuzzleSize() / 2
                    }}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p variants={itemVariants} className="text-lg sm:text-xl mb-6 bg-white p-4 rounded-xl shadow-lg">
                  Quel symbole était à la position {obsQuestion.index + 1} ?
                </p>
                <div variants={itemVariants} className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                  {obsOptions.map((icon, i) => (
                    <button
                      key={i}
                      onClick={() => { if (icon === obsQuestion.icon) onWin(); else onFail(); }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 sm:px-8 py-3 sm:py-4 text-3xl sm:text-4xl rounded-xl bg-[#ffd54f] shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* FINAL */}
        {stage === "challenge" && challengeType === "finalPuzzle" && (
          <div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center mt-8 relative z-10 w-full max-w-2xl px-4"
          >
            <h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-6">
              Question finale
            </h2>
            <p variants={itemVariants} className="text-lg sm:text-xl mb-8 bg-white p-6 rounded-2xl shadow-xl">
              {finalQues.question}
            </p>
            <div variants={itemVariants} className="flex flex-wrap gap-3 sm:gap-4 justify-center">
              {finalQues.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => onFinalClick(i)}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-[#ffd54f] font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STORY */}
        {stage === "story" && (
          <div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-2xl w-full mt-8 p-6 sm:p-8 bg-white rounded-2xl shadow-2xl relative z-10"
          >
            <p variants={itemVariants} className="leading-7 text-base sm:text-lg mb-6">
              {STORY_PARAGRAPHS[storyIndex - 1]}
            </p>
            <button
              variants={itemVariants}
              onClick={nextStage}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#ffd54f] font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Prochain défi →
            </button>
          </div>
        )}

        {/* LOST */}
        {stage === "lost" && (
          <div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-2xl w-full mt-8 p-6 sm:p-8 bg-white rounded-2xl shadow-2xl text-center relative z-10"
          >
            <h2 variants={itemVariants} className="text-3xl sm:text-4xl font-bold mb-4">
              💥 Game Over
            </h2>
            <p variants={itemVariants} className="text-base sm:text-lg mb-6">
              Tu as échoué. Réessaye pour continuer l'histoire d'Owly.
            </p>
            <div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={startChallenge}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl bg-[#ffd54f] font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                🔁 Réessayer ce défi
              </button>
              <button
                onClick={resetGame}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl bg-gray-300 font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Recommencer le jeu
              </button>
            </div>
          </div>
        )}

        {/* FINISHED */}
        {stage === "finished" && (
          <div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-3xl w-full mt-8 p-6 sm:p-8 bg-white rounded-2xl shadow-2xl relative z-10"
          >
            <h2 variants={itemVariants} className="text-3xl sm:text-4xl font-bold mb-8 text-center">
              🎉 Histoire complète d'Owly 🎉
            </h2>
            {STORY_PARAGRAPHS.map((p, i) => (
              <p 
                key={i} 
                variants={itemVariants}
                className="leading-7 text-base sm:text-lg mb-4"
              >
                {p}
              </p>
            ))}
            <button
              variants={itemVariants}
              onClick={resetGame}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#ffd54f] font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
            >
              🔄 Rejouer
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}