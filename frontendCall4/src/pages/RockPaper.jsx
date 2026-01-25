// src/pages/RockPaper.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Crown, Flame, Skull, ArrowLeft } from "lucide-react";
import clickSound from "../assets/sounds/click.wav";
import winSound from "../assets/sounds/win.wav";
import loseSound from "../assets/sounds/lose.wav";
import drawSound from "../assets/sounds/draw.wav";

// 🔊 Jouer un son
function playSound(file) {
  const audio = new Audio(file);
  audio.volume = 0.8;
  audio.play().catch(() => {});
}

const options = [
  { name: "rock", emoji: "🪨" },
  { name: "paper", emoji: "📄" },
  { name: "scissors", emoji: "✂️" },
];

function smartBot(player) {
  const smart = Math.random() < 0.5;
  if (smart) {
    if (player === "rock") return "paper";
    if (player === "paper") return "scissors";
    if (player === "scissors") return "rock";
  }
  return options[Math.floor(Math.random() * 3)].name;
}

export default function RockPaper() {
  const [playerChoice, setPlayerChoice] = useState(null);
  const [botChoice, setBotChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [anim, setAnim] = useState(false);
  const [shake, setShake] = useState(false);
  const [particles, setParticles] = useState([]);
  const [score, setScore] = useState({ player: 0, bot: 0 });

  const play = (choice) => {
    playSound(clickSound);
    setPlayerChoice(choice);
    setAnim(true);
    navigator.vibrate?.(30);

    setTimeout(() => {
      const bot = smartBot(choice);
      setBotChoice(bot);
      const res = getWinner(choice, bot);
      setResult(res);

      if (res === "win") {
        setScore((s) => ({ ...s, player: s.player + 1 }));
        playSound(winSound);
        spawnParticles("green");
      }

      if (res === "lose") {
        setScore((s) => ({ ...s, bot: s.bot + 1 }));
        playSound(loseSound);
        navigator.vibrate?.([120, 90, 120]);
        triggerShake();
        spawnParticles("red");
      }

      if (res === "draw") {
        playSound(drawSound);
        spawnParticles("yellow");
      }

      setAnim(false);
    }, 1500);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const spawnParticles = (color) => {
    const arr = Array.from({ length: 18 }).map(() => ({
      id: Math.random(),
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      color,
    }));
    setParticles(arr);
    setTimeout(() => setParticles([]), 700);
  };

  const getWinner = (player, bot) => {
    if (player === bot) return "draw";
    if (
      (player === "rock" && bot === "scissors") ||
      (player === "paper" && bot === "rock") ||
      (player === "scissors" && bot === "paper")
    )
      return "win";
    return "lose";
  };

  const resultText = {
    win: "Victory!",
    lose: "Defeat...",
    draw: "Draw!",
  };

  const resultEmoji = {
    win: "🔥🎉",
    lose: "💀⚡",
    draw: "😐🤝",
  };

  return (
    <div className={`w-full min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 text-white
      bg-gradient-to-br from-gray-900 via-black to-gray-900
      ${shake ? "animate-[shake_0.2s_ease-in-out_3]" : ""}`}
    >
      {/* Bouton retour */}
      <button
        onClick={() => (window.location.href = "/games")}
        className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2
        bg-white/10 border border-white/20 backdrop-blur-md
        rounded-xl text-white text-sm sm:text-base hover:bg-white/20
        transition shadow-lg z-50"
      >
        <ArrowLeft size={18} /> Retour
      </button>

      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
          transition={{ duration: 0.6 }}
          className="w-3 h-3 rounded-full absolute"
          style={{ backgroundColor: p.color }}
        />
      ))}

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 flex items-center gap-3 text-center">
        <Sparkles className="text-yellow-300" />
        <span className="bg-gradient-to-r from-pink-400 to-blue-400 text-transparent bg-clip-text">
          Rock Paper Scissors
        </span>
      </h1>

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 text-2xl mb-6">
        <div className="flex items-center gap-2 justify-center">
          <Crown className="text-yellow-300" /> {score.player}
        </div>
        <div className="flex items-center gap-2 justify-center">
          <Skull className="text-red-400" /> {score.bot}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-6">
        {/* Player */}
        <motion.div
          animate={anim ? { y: [0, -25, 0] } : {}}
          transition={{ duration: 0.4, repeat: anim ? Infinity : 0 }}
          className="text-6xl sm:text-8xl drop-shadow-xl"
        >
          {playerChoice ? options.find((o) => o.name === playerChoice).emoji : "❔"}
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Flame className="text-orange-400" size={40} />
        </motion.div>

        {/* Bot */}
        <motion.div
          animate={anim ? { y: [0, -25, 0] } : {}}
          transition={{ duration: 0.4, repeat: anim ? Infinity : 0 }}
          className="text-6xl sm:text-8xl drop-shadow-xl"
        >
          {botChoice ? options.find((o) => o.name === botChoice).emoji : "❔"}
        </motion.div>
      </div>

      <AnimatePresence>
        {result && !anim && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.6, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="text-3xl sm:text-5xl font-bold mt-8 text-center"
          >
            <span
              className={
                result === "win"
                  ? "text-green-400"
                  : result === "lose"
                  ? "text-red-400"
                  : "text-yellow-300"
              }
            >
              {resultEmoji[result]} {resultText[result]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 sm:mt-20 flex flex-wrap justify-center gap-4 sm:gap-8">
        {options.map((opt) => (
          <motion.button
            key={opt.name}
            whileTap={{ scale: 0.75 }}
            whileHover={{ scale: 1.2, rotate: 8 }}
            className="bg-white/10 backdrop-blur-lg p-4 sm:p-5 rounded-2xl text-4xl sm:text-6xl shadow-xl 
            border border-white/20 transition hover:shadow-white/40 hover:bg-white/20 flex items-center justify-center"
            onClick={() => play(opt.name)}
          >
            {opt.emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

