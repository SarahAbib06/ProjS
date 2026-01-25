import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import clickSound from "../assets/sounds/click.wav";
import winSound from "../assets/sounds/win.wav";
import loseSound from "../assets/sounds/lose.wav";
import confetti from "canvas-confetti"; // npm install canvas-confetti

const EMOJIS = ["🐶","🐱","🦊","🐸","🐵","🦁","🐼","🦄"];

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function playSound(sound) {
  const audio = new Audio(sound);
  audio.volume = 0.7;
  audio.play().catch(() => {});
}

export default function MemoryGame() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [disabled, setDisabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameSpeed, setGameSpeed] = useState(20);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef(null);

  const initGame = (resetLevel = false) => {
    const newCards = shuffle([...EMOJIS, ...EMOJIS].map((emoji, index) => ({
      id: index,
      emoji,
      flipped: false,
      matched: false,
      effect: false,
    })));
    setCards(newCards);
    setFlippedCards([]);
    setTimeLeft(gameSpeed);
    setDisabled(true);
    setMessage("");
    setGameOver(false);
    if (resetLevel) setLevel(prev => prev);
    clearInterval(timerRef.current);
  };

  useEffect(() => {
    initGame();
  }, [gameSpeed]);

  // Timer
  useEffect(() => {
    if (!disabled) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            if (!gameOver) loseGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [disabled, gameOver]);

  const handleClick = (card) => {
    if (disabled || card.flipped || card.matched) return;

    playSound(clickSound);

    const newCards = cards.map(c => c.id === card.id ? { ...c, flipped: true } : c);
    const newFlipped = [...flippedCards, card];
    setCards(newCards);
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setDisabled(true);
      setTimeout(() => checkMatch(newFlipped), 800);
    }
  };

  const checkMatch = ([card1, card2]) => {
    let newCards = [...cards];
    if (card1.emoji === card2.emoji) {
      newCards = newCards.map(c =>
        c.emoji === card1.emoji ? { ...c, matched: true, effect: true } : c
      );
      setTimeout(() => {
        newCards = newCards.map(c => ({ ...c, effect: false }));
        setCards(newCards);
      }, 500);
    } else {
      newCards = newCards.map(c =>
        c.id === card1.id || c.id === card2.id ? { ...c, flipped: false } : c
      );
    }
    setCards(newCards);
    setFlippedCards([]);
    setDisabled(false);

    if (newCards.every(c => c.matched)) {
      winGame();
    }
  };

  const winGame = () => {
    clearInterval(timerRef.current);
    setGameOver(true);
    playSound(winSound);
    setMessage("🎉 Niveau terminé !");
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const loseGame = () => {
    setGameOver(true);
    playSound(loseSound);
    setMessage("⏱ Temps écoulé ! Recommence depuis le niveau 1 !");
    setLevel(1);
    setGameSpeed(20);
    setTimeout(() => initGame(true), 1500);
  };

  const nextLevel = () => {
    setLevel(prev => prev + 1);
    setGameSpeed(prev => Math.max(prev - 5, 5));
    initGame();
  };

  const replayLevel = () => {
    initGame(true);
  };

  const timerStyle = {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: timeLeft <= 5 ? "red" : "black",
    transition: "color 0.3s",
  };

  const buttonStyle = {
    padding: "10px 20px",
    margin: "5px",
    fontSize: "1rem",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#ff9800",
    color: "#fff",
    fontWeight: "bold",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
    transition: "all 0.2s",
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px", position: "relative", padding: "0 10px" }}>
      <h2 style={timerStyle}>⏳ Temps restant: {timeLeft}s | Niveau: {level}</h2>

      {/* Boutons de contrôle avec Retour */}
      <div style={{ marginBottom: "15px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
  onClick={() => navigate("/games")}
  style={{
    position: "absolute",
    top: "20px",
    left: "20px",
    padding: "10px 20px",
    borderRadius: 10,
    background: "#555",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: 16,
    color: "#fff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    zIndex: 1000
  }}
>
  ← Retour
</button>


        <button style={buttonStyle} onClick={() => setDisabled(false)}>▶ Start</button>
        <button style={buttonStyle} onClick={() => setDisabled(true)}>⏸ Pause</button>
        <button style={buttonStyle} onClick={() => initGame(true)}>🔄 Reset</button>
      </div>

      {/* Grille responsive */}
      <div className="grid-responsive">
        {cards.map(card => (
          <motion.div
            key={card.id}
            layout
            whileHover={{ scale: 1.05 }}
            onClick={() => handleClick(card)}
            className="card"
            style={{
              backgroundColor: card.flipped || card.matched ? "#fffa" : "#555",
              boxShadow: card.effect ? "0 0 20px 5px #0ff" : "0 5px 15px rgba(0,0,0,0.3)",
            }}
          >
            <AnimatePresence>
              {(card.flipped || card.matched) && (
                <motion.span
                  key={card.emoji}
                  initial={{ rotateY: 180 }}
                  animate={{ rotateY: 0 }}
                  exit={{ rotateY: 180 }}
                >
                  {card.emoji}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Overlay central */}
      {message && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          display: "flex", justifyContent: "center", alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10, flexDirection: "column"
        }}>
          <h2 style={{ color: "#fff", fontSize: "2rem", marginBottom: "20px" }}>{message}</h2>
          <div>
            {gameOver && message.includes("terminé") && (
              <button style={buttonStyle} onClick={nextLevel}>➡ Continuer</button>
            )}
            <button style={buttonStyle} onClick={replayLevel}>🔄 Rejouer</button>
          </div>
        </div>
      )}

      {/* CSS responsive */}
      <style>{`
        .grid-responsive {
          display: grid;
          grid-template-columns: repeat(4, 100px); /* Desktop 4x4 */
          gap: 15px;
          justify-content: center;
          margin: 0 auto;
        }

        .card {
          border-radius: 15px;
          font-size: 2rem;
          cursor: pointer;
          user-select: none;
          display: flex;
          justify-content: center;
          align-items: center;
          aspect-ratio: 1 / 1;
          transition: box-shadow 0.3s;
        }

        @media (max-width: 1024px) { /* Tablette et mobile */
          .grid-responsive {
            grid-template-columns: repeat(3, 1fr); /* 3 colonnes */
            gap: 12px;
            max-width: 360px; /* 3x100px + gaps */
          }

          .card {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

