import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import clickSound from "../assets/sounds/click.wav";
import winSound from "../assets/sounds/win.wav";
import loseSound from "../assets/sounds/lose.wav";

const OWLY_IMAGE = "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=60";
const MEMORY_ICONS = ["🌿", "🌸", "⭐", "🐦"];
const STORY_PARAGRAPHS = [
  "Owly est né au cœur de la forêt d'Early, sous les étoiles. Dès son plus jeune âge, il montra une curiosité insatiable pour les mystères de la nature et les secrets des anciens arbres majestueux qui peuplaient la forêt. Son premier objectif fut d'apprendre à connaître les sons de la forêt et à identifier chaque créature par ses chants.",
  "Après le premier triomphe, Owly comprit que la forêt avait une logique et un ordre subtil. Il réalisa que chaque chemin, chaque rivière et chaque arbre avait un rôle précis dans l'écosystème. Ses nouvelles aventures lui apprirent l'importance de l'observation attentive et de la patience.",
  "Les épreuves suivantes apprirent à Owly la patience et la mémoire. Il devait se souvenir des séquences des fleurs, des chants des oiseaux, et des couleurs des feuilles à travers les saisons. Chaque succès renforçait sa confiance et sa compréhension de l'environnement qui l'entourait.",
  "Avant le dernier défi, Owly rencontra des créatures fantastiques. Chacune lui enseigna une leçon unique sur le courage, la logique et la créativité. Il devait utiliser toutes ces compétences combinées pour résoudre des énigmes complexes et naviguer à travers les labyrinthes de la forêt.",
  "Enfin, Owly découvrit la clairière des sages, un lieu mystique où la lumière filtrait à travers un dôme de feuilles scintillantes. Ici, il comprit la valeur de la sagesse, du partage et de la curiosité. Son parcours le transforma profondément et il était désormais prêt à transmettre ses connaissances."
];

const PUZZLE_PIECES = [
  { id: 0, order: 0 },
  { id: 1, order: 1 },
  { id: 2, order: 2 },
  { id: 3, order: 3 },
  { id: 4, order: 4 },
  { id: 5, order: 5 }
];

const btnStyle = {
  padding: "10px 20px",
  borderRadius: 10,
  background: "#ffd54f",
  border: "none",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: 16
};

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

  const [finalQues,setFinalQues]=useState({question:"Quel est le message final ?",options:["Gagner","Apprendre","Protéger","Dormir"],correct:2});

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
      setFinalQues({question:"Quel est le message final ?",options:shuffleArray(["Gagner","Apprendre","Protéger","Dormir"]),correct:2});
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

  const onWin=()=>{
    playSound(winSound);
    if(timerRef.current) clearInterval(timerRef.current);
    setStage("story");
    setStoryIndex(prev=>prev+1);
  };

  const onFail=()=>{
    playSound(loseSound);
    if(timerRef.current) clearInterval(timerRef.current);
    setStage("lost");
  };

  const nextStage=()=>{ if(storyIndex>=STORY_PARAGRAPHS.length) setStage("finished"); else startChallenge(); };
  const resetGame=()=>{ setStage("intro"); setStoryIndex(0); };

  return(
    <div style={{minHeight:"100vh",backgroundColor:"#FFFF99",padding:20,color:"#000",display:"flex",flexDirection:"column",alignItems:"center"}}>

      {/* BOUTON RETOUR */}
      <div style={{width:"100%", maxWidth:720, display:"flex", justifyContent:"flex-start"}}>
       <button
  onClick={() => navigate("/games")}
  style={{
    position: "absolute",
    top: "20px",
    left: "20px",
    padding: "10px 20px",
    borderRadius: 10,
    background: "#ffd54f",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: 16,
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    zIndex: 1000
  }}
>
  ⬅ Retour
</button>
      </div>

      <motion.h1 initial={{y:-50,opacity:0}} animate={{y:0,opacity:1}} style={{fontSize:"3rem"}}>🦉 Owly Quiz 🦉</motion.h1>

      {/* INTRO */}
      {stage==="intro" && <div style={{maxWidth:720,textAlign:"center",marginTop:40,padding:20,background:"#fff",borderRadius:12}}>
        <p>Ce jeu raconte l'histoire d'Owly. Pour la découvrir, réussis chaque défi.</p>
        <button onClick={startChallenge} style={btnStyle}>Start</button>
      </div>}

      {/* PUZZLE */}
      {stage==="challenge" && challengeType==="puzzle" && <div style={{marginTop:30}}>
        <h2>Puzzle — reconstitue l'image</h2>
        <p>Timer : {timer}s</p>
        <div style={{
          display:"grid",
          gridTemplateColumns:`repeat(3, ${getPuzzleSize()}px)`,
          gridTemplateRows:`repeat(2, ${getPuzzleSize()}px)`,
          gap:6,
          marginTop:20,
          justifyContent:"center"
        }}>
          {pieces.map((p,idx)=>
            <div key={p.id} onClick={()=>onPieceClick(idx)}
              style={{
                width:getPuzzleSize(),
                height:getPuzzleSize(),
                cursor:"pointer",
                border:selected===idx?"3px solid #ffd54f":"2px solid #000",
                borderRadius:6,
                backgroundImage:`url(${OWLY_IMAGE})`,
                backgroundSize:"300% 200%",
                backgroundPosition:pieceBgPos(p.order)
              }}/>
          )}
        </div>
      </div>}

      {/* MEMORY */}
      {stage==="challenge" && challengeType==="memory" && <div style={{textAlign:"center",marginTop:30}}>
        <h2>Défi mémoire</h2>
        <div style={{fontSize:32,marginBottom:10}}>
          {playerSeq.length>0 ? playerSeq.map(s=>s) : memorySeq.map(()=> "❓")}
        </div>
        <div>
          {memoryButtons.map((s,i)=><button key={i} onClick={()=>onMemoryClick(s)} style={btnStyle}>{s}</button>)}
        </div>
      </div>}

      {/* CUPS */}
      {stage==="challenge" && challengeType==="cups" && <div style={{textAlign:"center",marginTop:30}}>
        <h2>Défi rapidité & logique — Trouve la boule !</h2>
        <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:20}}>
          {cups.map((c,i)=>
            <div key={i} onClick={()=>onCupClick(i)}
              style={{width:getPuzzleSize(),height:getPuzzleSize(),borderRadius:10,backgroundColor:"#fff",border:"2px solid #000",display:"flex",justifyContent:"center",alignItems:"center",cursor:"pointer"}}>
                {ballVisible && c ? "⚪" : ""}
            </div>
          )}
        </div>
      </div>}

      {/* OBSERVATION VISUELLE */}
      {stage==="challenge" && challengeType==="obsChallenge" && <div style={{textAlign:"center",marginTop:30}}>
        <h2>Défi d'observation visuelle</h2>
        {showGrid ? (
          <div style={{display:"grid",gridTemplateColumns:`repeat(2, ${getPuzzleSize()}px)`,gap:10,justifyContent:"center",marginTop:20}}>
            {obsGrid.map((icon,i)=><div key={i} style={{width:getPuzzleSize(),height:getPuzzleSize(),fontSize:getPuzzleSize()/2,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #000",borderRadius:8}}>{icon}</div>)}
          </div>
        ) : (
          <>
            <p>Quel symbole était à la position {obsQuestion.index + 1} ?</p>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:20}}>
              {obsOptions.map((icon,i)=>
                <button key={i} onClick={()=>{if(icon===obsQuestion.icon) onWin(); else onFail();}} style={btnStyle}>{icon}</button>
              )}
            </div>
          </>
        )}
      </div>}

      {/* FINAL */}
      {stage==="challenge" && challengeType==="finalPuzzle" && <div style={{textAlign:"center",marginTop:30}}>
        <h2>Question finale</h2>
        <p>{finalQues.question}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:20}}>
          {finalQues.options.map((opt,i)=><button key={i} onClick={()=>onFinalClick(i)} style={btnStyle}>{opt}</button>)}
        </div>
      </div>}

      {/* STORY */}
      {stage==="story" && <div style={{maxWidth:720,marginTop:40,padding:20,background:"#fff",borderRadius:12}}>
        <p style={{lineHeight:"1.6rem", fontSize:"1.1rem"}}>{STORY_PARAGRAPHS[storyIndex-1]}</p>
        <button onClick={nextStage} style={{...btnStyle,marginTop:20}}>Prochain défi</button>
      </div>}

      {/* LOST */}
      {stage==="lost" && <div style={{maxWidth:720,marginTop:40,padding:20,background:"#fff",borderRadius:12,textAlign:"center"}}>
        <h2>💥 Game Over</h2>
        <p>Tu as échoué. Réessaye pour continuer l'histoire d'Owly.</p>
        <button onClick={startChallenge} style={btnStyle}>🔁 Réessayer ce défi</button>
        <button onClick={resetGame} style={btnStyle}>Recommencer le jeu</button>
      </div>}

      {/* FIN */}
      {stage==="finished" && <div style={{maxWidth:720,marginTop:40,padding:20,background:"#fff",borderRadius:12}}>
        <h2>🎉 Histoire complète d'Owly 🎉</h2>
        {STORY_PARAGRAPHS.map((p,i)=><p key={i} style={{lineHeight:"1.6rem", fontSize:"1.1rem"}}>{p}</p>)}
        <button onClick={resetGame} style={{...btnStyle,marginTop:20}}>Rejouer</button>
      </div>}

    </div>
  );
}
