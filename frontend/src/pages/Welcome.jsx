import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../assets/images/owlylogo.png";
import Button from "../components/Button";

const Welcome = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/register");
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-center px-4 overflow-hidden"
      style={{
        backgroundColor: "#f9ee34",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Logo - Le hibou "vole" depuis le haut avec un effet de plané */}
      <motion.img
        src={logo}
        alt="Owly logo"
        className="w-60 h-86 -mt-20 mb-0 object-contain"
        initial={{ 
          y: -300, 
          opacity: 0, 
          rotate: -30,
          scale: 0.5 
        }}
        animate={{ 
          y: 0, 
          opacity: 1, 
          rotate: 0,
          scale: 1 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 30, 
          damping: 12,
          duration: 1.2 
        }}
        whileHover={{ 
          rotate: [0, -5, 5, -5, 0],
          transition: { duration: 0.5 }
        }}
      />

      {/* Slogan - Apparaît lettre par lettre comme un message qui arrive */}
      <motion.h1 
        className="text-2xl md:text-3xl font-semibold -mt-20 text-black mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        {'"Owly, where messages fly fast."'.split('').map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1 + index * 0.03,
              duration: 0.8
            }}
          >
            {char}
          </motion.span>
        ))}
      </motion.h1>

      {/* Bouton Connexion - Glisse depuis la gauche comme un message envoyé */}
      <motion.div 
        className="mt-7 w-full max-w-xs"
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ 
          delay: 2.2,
          type: "spring",
          stiffness: 60,
          damping: 15
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button onClick={handleLogin} label="Connexion" />
      </motion.div>

      {/* Lien Créez un compte - Glisse depuis la droite */}
      <motion.span
        onClick={handleSignup}
        className="mt-4 text-myBlack cursor-pointer text-sm"
        initial={{ x: 200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ 
          delay: 2.4,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
        whileHover={{ 
          scale: 1.1,
          color: "#333"
        }}
      >
        Créez un compte
      </motion.span>
    </div>
  );
};

export default Welcome;