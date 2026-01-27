import React, { useState, useEffect, useRef } from "react";
import winSound from "../assets/audio/win.wav";
import errorSound from "../assets/audio/error.wav";
import clickSound from "../assets/audio/click.mp3";
import { useNavigate } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
export default function GuessNumberGame() {
  const { t } = useTranslation();
  const [targetNumber, setTargetNumber] = useState(0);
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
 
  const [gameWon, setGameWon] = useState(false);
  const [history, setHistory] = useState([]);
  const [difficulty, setDifficulty] = useState(100);
 
const navigate = useNavigate();
  // Références audio
  const clickAudio = useRef(null);
  const winAudio = useRef(null);
  const errorAudio = useRef(null);

  useEffect(() => {
    startNewGame();
  }, []);


  const startNewGame = () => {
    const random = Math.floor(Math.random() * difficulty) + 1;
    setTargetNumber(random);
    setGuess("");
   setMessage(t("guessNumber.startMessage", { max: difficulty }));
    setAttempts(0);
    setGameWon(false);
    setHistory([]);
  };

  const changeDifficulty = (level) => {
    if (clickAudio.current) clickAudio.current.play();
    setDifficulty(level);
    const random = Math.floor(Math.random() * level) + 1;
    setTargetNumber(random);
    setGuess("");
    setMessage(t("guessNumber.startMessage", { max: level }));

    setAttempts(0);
    setGameWon(false);
    setHistory([]);
  };

  const checkGuess = () => {
    if (clickAudio.current) clickAudio.current.play();

    const userGuess = parseInt(guess);

    if (!userGuess || userGuess < 1 || userGuess > difficulty) {
      setMessage(t("guessNumber.invalid", { max: difficulty }));

      if (errorAudio.current) errorAudio.current.play();
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const newHistory = [...history, userGuess];
    setHistory(newHistory);

    if (userGuess === targetNumber) {
      setGameWon(true);
     setMessage(t("guessNumber.win", { count: newAttempts }));

      if (winAudio.current) winAudio.current.play();

      
    } else {
      const distance = Math.abs(userGuess - targetNumber);
      let hint = "";

      if (distance <= 5)hint = t("guessNumber.hot");
      else if (distance <= 10) hint = t("guessNumber.cool");
      else if (distance <= 20) hint = t("guessNumber.cold");
      else hint = t("guessNumber.cold");

      if (userGuess < targetNumber)  setMessage(`${hint} 📈 ${t("guessNumber.higher")}`);
      else  setMessage(`${hint} 📉 ${t("guessNumber.lower")}`);
    }

    setGuess("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !gameWon) checkGuess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-myYellow via-myYellow2 to-myGray2 flex items-center justify-center p-2 sm:p-4">
         {/* Boutons de contrôle avec Retour */}
     {/* Bouton de retour fixe */}
{/* Bouton retour identique à MemoryGame */}
<button
  onClick={() => navigate("/games")}
  className="
    fixed
    left-25
    -top-0 md:top-2 
    
    z-50
    p-3
    bg-black text-yellow-400
    rounded-full
    shadow-lg
    hover:bg-gray-800 hover:text-yellow-300
    transition
    flex items-center justify-center
    cursor-pointer
  "
>
  <IoArrowBackOutline className="text-2xl sm:text-3xl" />
</button>


      <audio ref={clickAudio} src={clickSound} />
      <audio ref={winAudio} src={winSound} />
      <audio ref={errorAudio} src={errorSound} />

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-md w-full">
        {/* Titre */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 sm:mb-4 bg-gradient-to-r from-myYellow to-gray-800 bg-clip-text text-transparent">
         {t("guessNumber.title")}
        </h1>

      

        {/* Niveaux de difficulté */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => changeDifficulty(50)}
            className={`flex-1 py-2 sm:py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              difficulty === 50
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            😊 {t("guessNumber.easy")}
          </button>
          <button
            onClick={() => changeDifficulty(100)}
            className={`flex-1 py-2 sm:py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              difficulty === 100
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            😎 {t("guessNumber.medium")}
          </button>
          <button
            onClick={() => changeDifficulty(500)}
            className={`flex-1 py-2 sm:py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              difficulty === 500
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            🔥 {t("guessNumber.hard")}
          </button>
        </div>

        {/* Message */}
        <div
          className={`text-center p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 font-semibold text-base sm:text-lg ${
            gameWon ? "bg-green-100 text-green-700 animate-pulse" : "bg-myYellow2 text-gray-700"
          }`}
        >
          {message}
        </div>

        {/* Nombre de tentatives */}
        <p className="text-center text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
          📊 {t("guessNumber.attempts")} : <span className="font-bold text-myYellow">{attempts}</span>
        </p>

        {/* Input et bouton */}
        {!gameWon && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
            <input
              type="number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("guessNumber.placeholder")}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-base sm:text-lg"
              min="1"
              max={difficulty}
            />
            <button
              onClick={checkGuess}
              className="bg-gradient-to-r from-myYellow to-gray-600 text-white px-6 py-2 sm:py-3 rounded-lg font-bold hover:from-myYellow hover:to-gray-600 transition-all transform hover:scale-105 text-base sm:text-lg"
            >
            {t("guessNumber.go")}
            </button>
          </div>
        )}

        {/* Bouton rejouer */}
        {gameWon && (
          <button
            onClick={startNewGame}
            className="w-full bg-gradient-to-r from-green-500 to-myYellow2 text-white py-2 sm:py-3 rounded-lg font-bold hover:from-green-600 hover:to-myYellow2 transition-all transform hover:scale-105 mb-4 sm:mb-6 text-base sm:text-lg"
          >
           {t("guessNumber.replay")}
          </button>
        )}

        {/* Historique */}
        {history.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-2">📝 {t("guessNumber.history")}
</p>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    h === targetNumber
                      ? "bg-green-500 text-white"
                      : h < targetNumber
                      ? "bg-myYellow2 text-gray-600"
                      : "bg-red-200 text-red-700"
                  }`}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
