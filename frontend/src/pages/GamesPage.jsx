import React from "react";
import { useNavigate } from "react-router-dom";
import { GiGamepad } from "react-icons/gi";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function GamesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const games = [
    { name: t("gamesPage.owly_quiz"), route: "/owly-quiz", icon: "🦉" },
    { name: t("gamesPage.rock_paper_scissors"), route: "/rock-paper-scissors", icon: "✊" },
    { name: t("gamesPage.memory_game"), route: "/memory-game", icon: "🧠" },
    { name: t("gamesPage.tictac"), route: "/tic-tac-toe2", icon: "❌" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start bg-myYellow text-black dark:text-white relative overflow-hidden">
      
      {/* Décoration de fond animée */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.06, 0.03]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-black dark:bg-white rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.03, 0.06, 0.03]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-black dark:bg-white rounded-full blur-3xl"
        />
      </div>

      {/* HEADER */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8 sm:mb-12 relative z-10"
      >
        <motion.h1 
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold flex items-center gap-3 sm:gap-4"
        >
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="flex-shrink-0"
          >
            <GiGamepad className="text-black dark:text-white drop-shadow-lg w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
          </motion.div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-700 dark:from-white dark:to-gray-300">
            {t("gamesPage.choose_game")}
          </span>
        </motion.h1>

        {/* Bouton retour modernisé */}
        <motion.button
          onClick={() => navigate("/MessagesPage")}
          whileTap={{ scale: 0.95 }}
          className="
            px-4 sm:px-6 py-2 sm:py-3 
            bg-black dark:bg-white 
            text-myYellow dark:text-black 
            font-bold rounded-xl 
            shadow-lg shadow-black/20 dark:shadow-white/20
            hover:shadow-xl hover:shadow-black/30 dark:hover:shadow-white/30
            transition-all duration-300
            relative overflow-hidden group
            text-sm sm:text-base
            w-full sm:w-auto
          "
        >
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black dark:from-gray-200 dark:to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>←</span>
            {t("gamesPage.back")}
          </span>
        </motion.button>
      </motion.div>

      {/* GRILLE DES JEUX */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-6xl relative z-10 px-2 sm:px-0"
      >
        {games.map((game, idx) => (
          <motion.div
            key={idx}
            variants={cardVariants}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(game.route)}
            className="
              cursor-pointer p-6 sm:p-8 rounded-2xl 
              bg-white dark:bg-gray-800 
              shadow-xl shadow-black/10 dark:shadow-black/30
              flex flex-col items-center justify-center 
              relative overflow-hidden group
              border-2 border-transparent
              hover:border-black dark:hover:border-white
              transition-all duration-300
              min-h-[200px] sm:min-h-[240px]
            "
          >
            {/* Effet de brillance au survol */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-myYellow/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
            
            {/* Effet de particules */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-myYellow rounded-full"
                  initial={{ 
                    x: Math.random() * 100 + '%',
                    y: '100%',
                    opacity: 0
                  }}
                  animate={{
                    y: '-100%',
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>

            {/* Icône emoji */}
            <motion.div
              className="text-5xl sm:text-6xl mb-3 sm:mb-4 relative z-10"
              whileHover={{ 
                rotate: [0, -10, 10, -10, 0]
              }}
              transition={{ duration: 0.5 }}
            >
              {game.icon}
            </motion.div>

            {/* Nom du jeu */}
            <motion.span 
              className="text-base sm:text-xl font-bold mb-2 sm:mb-3 text-center relative z-10 text-black dark:text-white px-2"
            >
              {game.name}
            </motion.span>

            {/* Icône de manette */}
            <motion.div
              className="relative z-10"
              animate={{
                y: [0, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <GiGamepad className="w-8 h-8 sm:w-10 sm:h-10 text-myYellow/80 dark:text-myYellow group-hover:text-myYellow transition-colors" />
            </motion.div>

            {/* Badge "Jouer" au survol */}
            <motion.div
              className="
                absolute bottom-3 sm:bottom-4 
                bg-black dark:bg-white 
                text-myYellow dark:text-black 
                px-3 sm:px-4 py-1 sm:py-1.5 rounded-full 
                text-xs sm:text-sm font-bold
                opacity-0 group-hover:opacity-100
                transition-opacity duration-300
                shadow-lg
              "
            >
              Jouer →
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Texte décoratif en bas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-8 sm:mt-12 text-center text-black/40 dark:text-white/40 text-xs sm:text-sm relative z-10 px-4"
      >
        <motion.p
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Sélectionnez un jeu pour commencer l'aventure
        </motion.p>
      </motion.div>
    </div>
  );
}