// src/components/FormCard.jsx
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import logo from "../assets/images/owlylogo.png";

const FormCard = ({ title, subtitle, children, topRight }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="
        bg-white dark:bg-mydarkGray3 shadow-lg rounded-2xl 
        flex flex-col md:flex-row
        min-h-0
        w-[92%]
        h-[600px]
        sm:h-auto
        sm:w-[500px]
        md:w-[800px]
        max-w-full
        overflow-hidden
        p-2
        relative
      "
    >
      {/* Particules flottantes en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-myYellow/30 rounded-full"
            initial={{
              x: Math.random() * 100 + '%',
              y: '100%',
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              y: '-20%',
              x: `${Math.random() * 100}%`,
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Bouton responsive avec animation */}
      {topRight && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="absolute top-4 right-4 z-20"
        >
          {topRight}
        </motion.div>
      )}

      {/* Partie gauche avec fond jaune */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-myYellow md:w-1/2 w-full relative flex justify-center items-center h-[70px] xs:h-[100px] sm:h-[130px] md:h-auto p-2 md:p-4 text-center rounded-xl m-0 md:m-2 overflow-hidden"
      >
        {/* Effet de brillance qui traverse */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 5,
            ease: "easeInOut"
          }}
        />

        {/* Logo avec animation de vol */}
        <motion.div
          className="inset-0 flex justify-center items-center md:-mt-30"
          initial={{ y: 100, opacity: 0, rotate: -15 }}
          animate={{ 
            y: 0, 
            opacity: 1, 
            rotate: 0,
          }}
          transition={{ 
            duration: 1, 
            delay: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <motion.img
            src={logo}
            alt="Logo"
            className="w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] md:w-[400px] md:h-[400px] object-contain"
            animate={{
              y: [0, -10, 0],
              rotate: [0, -3, 3, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            whileHover={{
              scale: 1.05,
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.5 }
            }}
          />
        </motion.div>

        {/* Texte avec animation de glissement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] text-left"
        >
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-xs sm:text-sm text-myBlack font-medium"
          >
            {t('formCard.leftText1')}
          </motion.p>
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-xs sm:text-sm dark:text-myBlack font-semibold mt-2"
          >
            {t('formCard.leftText2')}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Partie droite avec contenu */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="md:w-1/2 w-full flex flex-col justify-center items-center md:items-start min-h-0 p-4 sm:p-6 md:p-8 relative"
      >
        {/* Titre avec effet de typing */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-2xl sm:text-2xl font-semibold mb-2 text-center md:text-left"
        >
          {title}
        </motion.h2>

        {/* Sous-titre avec animation */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-[14px] text-myBlack dark:text-myWhite mb-6 text-center md:text-left"
        >
          {subtitle}
        </motion.p>

        {/* Contenu avec animation staggered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="w-full"
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default FormCard;