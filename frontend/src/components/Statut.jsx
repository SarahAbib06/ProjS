import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState, useEffect } from "react";

export default function Statut({ setPrivacySubPage, selection, setSelection }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  // 🆕 Charger le paramètre au démarrage
  useEffect(() => {
    const loadStatusVisibility = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (data.statusVisibility) {
          setSelection(data.statusVisibility);
        }
      } catch (error) {
        console.error("Erreur chargement statut:", error);
      }
    };

    loadStatusVisibility();
  }, [setSelection]);

  // 🆕 Sauvegarder quand la sélection change
  const handleSelectionChange = async (value) => {
    setSelection(value);
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/users/status-visibility", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ visibility: value })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      console.log("✅ Paramètre de visibilité sauvegardé:", value);
    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 100 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 160,
        damping: 25,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: 100,
      transition: { duration: 0.5 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };

  const options = [
    { value: "Tout le monde", label: t("statut.Everyone") },
    { value: "Personne", label: t("statut.NoOne") }
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="
        w-full
        bg-myGray4 dark:bg-mydarkGray3
        rounded-xl 
        shadow-md 
        border border-myGray4 dark:border-gray-700
        p-6
        h-auto max-h-[100vh]
        overflow-auto
      "
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            whileHover={{ x: -5, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <FaArrowLeft
              className="w-4 h-4 text-myBlack dark:text-white cursor-pointer"
              onClick={() => setPrivacySubPage(null)}
            />
          </motion.div>
          <h1 className="text-2xl font-semibold text-myBlack dark:text-white ml-3">
            {t("statut.Title")}
          </h1>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {t("statut.Description")}
        </p>

        {/* 🆕 Indicateur de sauvegarde */}
        {saving && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-myYellow mt-2"
          >
            ⏳ Sauvegarde en cours...
          </motion.p>
        )}
      </motion.div>

      {/* Options */}
      <div className="mt-6 flex flex-col gap-3">
        {options.map((option) => {
          const isSelected = selection === option.value;
          
          return (
            <motion.div
              key={option.value}
              variants={itemVariants}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => handleSelectionChange(option.value)}
              className={`
                flex items-center gap-4 p-4 rounded-xl cursor-pointer
                border-2 transition-all duration-200
                ${isSelected 
                  ? "border-[#F9EE34] bg-[#F9EE34]/10 dark:bg-[#F9EE34]/5" 
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2E2F2F] hover:border-gray-300 dark:hover:border-gray-600"
                }
              `}
            >
              {/* Radio button custom */}
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                  border-2 transition-all duration-200
                  ${isSelected 
                    ? "bg-[#F9EE34] border-[#F9EE34]" 
                    : "border-gray-300 dark:border-gray-500"
                  }
                `}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-4 h-4 text-myBlack" strokeWidth={3} />
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <span className={`
                text-sm font-medium
                ${isSelected 
                  ? "text-myBlack dark:text-white" 
                  : "text-gray-700 dark:text-gray-300"
                }
              `}>
                {option.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}