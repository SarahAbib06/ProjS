import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Mail, FileText, MessageCircle, Shield, Zap } from "lucide-react";
import { useState } from "react";
import ContactModal from "./ContactModal";
import DocumentationModal from "./DocumentationModal";

export default function ParametresAide({ setSelectedMenu }) {
  const { t } = useTranslation();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

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

  const faqItems = [
    {
      id: "messages",
      icon: MessageCircle,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      question: "Comment envoyer une invitation à un contact ?",
      answer: "Pour ajouter un nouveau contact, recherchez son nom d'utilisateur dans la barre de recherche, puis envoyez-lui une invitation. L'autre personne devra accepter votre demande pour devenir votre contact."
    },
    {
      id: "calls",
      icon: Shield,
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10",
      question: "Mes conversations sont-elles sécurisées ?",
      answer: "Oui ! Tous vos messages personnels sont chiffrés de bout en bout. Cela signifie que seuls vous et votre destinataire pouvez lire les messages échangés."
    },
    {
      id: "block",
      icon: Shield,
      iconColor: "text-red-500",
      iconBg: "bg-red-500/10",
      question: "Comment bloquer un utilisateur ?",
      answer: "Ouvrez une conversation avec l'utilisateur, cliquez sur les options (3 points), puis sélectionnez 'Bloquer'. Les utilisateurs bloqués ne pourront plus vous contacter."
    },
    {
      id: "games",
      icon: Zap,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/10",
      question: "Comment accéder aux jeux ?",
      answer: "Cliquez sur l'icône 'Jeux' dans la barre latérale pour accéder à nos jeux intégrés : Owly Quiz, Pierre-Papier-Ciseaux, Jeu de Mémoire et Devine le nombre."
    },
    {
      id: "ai",
      icon: MessageCircle,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10",
      question: "Qu'est-ce qu'Owly AI ?",
      answer: "Owly AI est notre assistant intelligent qui peut répondre à vos questions, vous aider et discuter avec vous. Accédez-y depuis la barre latérale."
    }
  ];

  const supportCards = [
    {
      icon: Mail,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      title: "Nous contacter",
      description: "Besoin d'aide ? Envoyez-nous un e-mail",
      action: "owly.app.team@gmail.com"
    },
    {
      icon: FileText,
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10",
      title: "Documentation",
      description: "Guides et tutoriels complets",
      action: "Consulter les docs"
    }
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
            h-auto
        overflow-auto
      "
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            whileHover={{ x: -5, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <FaArrowLeft
              onClick={() => setSelectedMenu(null)}
              className="w-5 h-5 text-myBlack dark:text-white cursor-pointer lg:hidden"
            />
          </motion.div>
          <h1 className="text-2xl font-semibold text-myBlack dark:text-white">
            Aide & Support
          </h1>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Trouvez des réponses à vos questions
        </p>
      </motion.div>

      {/* App Info Card */}
      <motion.div
        variants={itemVariants}
        className="
          mt-6 p-5 rounded-xl
          bg-gradient-to-br from-[#F9EE34]/20 to-[#F9EE34]/5
          border-2 border-[#F9EE34]/30
        "
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F9EE34] flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-6 h-6 text-myBlack" />
          </div>
          <div>
            <h3 className="font-semibold text-myBlack dark:text-white mb-1">
              À propos d'Owly
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Owly est votre application de messagerie complète avec chat sécurisé, appels, jeux intégrés et assistant IA. Version 1.0.0
            </p>
          </div>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div variants={itemVariants} className="mt-6">
        <h2 className="text-lg font-semibold text-myBlack dark:text-white mb-3">
          Questions fréquentes
        </h2>

        <div className="flex flex-col gap-2">
          {faqItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedFaq === item.id;

            return (
              <motion.div
                key={item.id}
                initial={false}
                className="
                  rounded-xl overflow-hidden
                  bg-white dark:bg-[#2E2F2F]
                  border border-gray-200 dark:border-gray-700
                "
              >
                {/* Question */}
                <motion.button
                  onClick={() => setExpandedFaq(isExpanded ? null : item.id)}
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                  className="w-full p-4 flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                    <Icon className={`w-4 h-4 ${item.iconColor}`} />
                  </div>

                  <span className="flex-1 text-left text-sm font-medium text-myBlack dark:text-white">
                    {item.question}
                  </span>

                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </motion.button>

                {/* Answer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-11">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Support Cards */}
      <motion.div variants={itemVariants} className="mt-6">
        <h2 className="text-lg font-semibold text-myBlack dark:text-white mb-3">
          Besoin d'aide supplémentaire ?
        </h2>

        <div className="flex flex-col gap-3">
          {supportCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => {
                  if (card.title === "Nous contacter") {
                    setIsContactModalOpen(true);
                  }
                  if (card.title === "Documentation") {
                    setIsDocModalOpen(true);
                  }
                }}
                className="
                  p-4 rounded-xl cursor-pointer
                  bg-white dark:bg-[#2E2F2F]
                  border border-gray-200 dark:border-gray-700
                  hover:border-gray-300 dark:hover:border-gray-600
                  transition-all duration-200
                "
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-myBlack dark:text-white">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {card.description}
                    </p>
                  </div>

                  <span className="text-xs font-medium text-[#F9EE34]">
                    {card.action}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
      <DocumentationModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />
    </motion.div>
  );
}