

  // frontend/src/components/ForgotPasswordModal.jsx

import { useState } from "react";
import { FaEnvelope, FaLock, FaTimes } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import Modal from "./Modal";
import InputField from "./InputField";
import Button from "./Button";
import { useTranslation } from "react-i18next";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setStep(1);
    setEmail("");
    setOtp(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmPassword("");
    setToken("");
    setError("");
    onClose();
  };

  // ==================== ÉTAPE 1: EMAIL ====================
  const handleEmailSubmit = async () => {
    setError("");

    if (!email) {
      setError(t("forgotPassword.errors.emailRequired") || "Veuillez entrer votre email");
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPassword(email);
      setToken(response.token);
      setStep(2);
    } catch (err) {
      setError(err.message || t("forgotPassword.errors.sendOtpError"));
    } finally {
      setLoading(false);
    }
  };

  // ==================== ÉTAPE 2: OTP ====================
  const handleOtpChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.getElementById(`modal-otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`modal-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpSubmit = () => {
    setError("");

    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError(t("forgotPassword.errors.otpIncomplete") || "Veuillez entrer le code OTP complet");
      return;
    }

    setStep(3);
  };

  // ==================== ÉTAPE 3: NOUVEAU MOT DE PASSE ====================
  const handlePasswordSubmit = async () => {
    setError("");

    if (!newPassword || !confirmPassword) {
      setError(t("forgotPassword.errors.fieldsRequired") || "Veuillez remplir tous les champs");
      return;
    }

    if (newPassword.length < 8) {
      setError(t("forgotPassword.errors.passwordTooShort") || "Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("forgotPassword.errors.passwordMismatch") || "Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, otp.join(""), newPassword, confirmPassword);
      alert(t("forgotPassword.success") || "Mot de passe réinitialisé avec succès !");
      handleClose();
    } catch (err) {
      setError(err.message || t("forgotPassword.errors.resetError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-myGray2 hover:text-myBlack transition-colors"
        >
          <FaTimes size={20} />
        </button>

        {/* ÉTAPE 1: EMAIL */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-center mb-2 text-myBlack">
              {t("forgotPassword.title") || "Mot de passe oublié ?"}
            </h2>
            <p className="text-sm text-myGray2 text-center mb-6">
              {t("forgotPassword.emailDescription") || "Entrez votre email pour recevoir un code"}
            </p>

            <InputField
              type="email"
              placeholder={t("login.emailPlaceholder") || "Votre email"}
              icon={<FaEnvelope />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                label={t("forgotPassword.cancel") || "Annuler"}
                onClick={handleClose}
              />
              <Button
                label={loading ? (t("forgotPassword.sending") || "Envoi...") : (t("forgotPassword.send") || "Envoyer")}
                variant="primary"
                onClick={handleEmailSubmit}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* ÉTAPE 2: OTP */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-center mb-2 text-myBlack">
              {t("forgotPassword.otpTitle") || "Code de vérification"}
            </h2>
            <p className="text-sm text-myGray2 text-center mb-2">
              {t("forgotPassword.otpSentTo") || "Code envoyé à"}
            </p>
            <p className="text-sm font-semibold text-center mb-6 text-myBlack">{email}</p>

            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`modal-otp-${idx}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  placeholder="0"
                  maxLength={1}
                  className="text-center w-10 h-12 sm:w-12 sm:h-12 text-lg font-bold rounded-lg border border-myGray3 focus:outline-none focus:ring-2 focus:ring-myYellow transition-all duration-300"
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                label={t("forgotPassword.back") || "Retour"}
                onClick={() => setStep(1)}
              />
              <Button
                label={t("forgotPassword.verify") || "Vérifier"}
                variant="primary"
                onClick={handleOtpSubmit}
              />
            </div>
          </div>
        )}

        {/* ÉTAPE 3: NOUVEAU MOT DE PASSE */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-center mb-2 text-myBlack">
              {t("forgotPassword.newPasswordTitle") || "Nouveau mot de passe"}
            </h2>
            <p className="text-sm text-myGray2 text-center mb-6">
              {t("forgotPassword.newPasswordDescription") || "Créez votre nouveau mot de passe"}
            </p>

            <InputField
              type="password"
              placeholder={t("forgotPassword.newPasswordPlaceholder") || "Nouveau mot de passe"}
              icon={<FaLock />}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <InputField
              type="password"
              placeholder={t("forgotPassword.confirmPasswordPlaceholder") || "Confirmer"}
              icon={<FaLock />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <Button
              label={loading ? (t("forgotPassword.resetting") || "Réinitialisation...") : (t("forgotPassword.reset") || "Réinitialiser")}
              variant="primary"
              onClick={handlePasswordSubmit}
              className="mt-2"
              disabled={loading}
            />
          </div>
        )}
      </div>

      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </Modal>
  );
};

export default ForgotPasswordModal;