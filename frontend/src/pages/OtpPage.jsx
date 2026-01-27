// frontend/src/pages/OtpPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import FormCard from "../components/FormCard.jsx";
import Button from "../components/Button.jsx";
import LanguageToggle from "../components/LanguageToggle.jsx";
import { useTranslation } from "react-i18next";

const OtpPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, verifyInactivityOtp, resendOtp } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Récupérer les données depuis la navigation
  const email = location.state?.email;
  const token = location.state?.token;
  const type = location.state?.type; // 'register' ou 'inactivity'
  const redirectTo = location.state?.redirectTo || '/dashboard'; // Par défaut Dashboard

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError(t("otp.errors.incomplete") || "Code OTP incomplet");
      return;
    }

    setLoading(true);

    try {
      if (type === 'register') {
        // Vérification OTP pour inscription
        await verifyOtp(email, otpCode);
        setSuccess(t("otp.success") || "Compte créé avec succès !");
        setTimeout(() => navigate("/profil-pic", { state: { email } }), 1500); // Redirige vers login
      } else if (type === 'inactivity') {
        // Vérification OTP pour inactivité
        await verifyInactivityOtp(token, otpCode);
        setSuccess(t("otp.successLogin") || "Connexion réussie !");
        setTimeout(() => navigate(redirectTo), 1500); // Redirige vers dashboard
      }
    } catch (err) {
      setError(err.message || t("otp.errors.invalid") || "Code OTP invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await resendOtp(email);
      setSuccess(t("otp.resent") || "Code renvoyé avec succès !");
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err.message || t("otp.errors.resendFailed") || "Erreur lors du renvoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-myGray3 dark:bg-black px-3 sm:px-6 relative">
      <FormCard topRight={<LanguageToggle />}>
        <div className="flex flex-col justify-center w-full h-auto md:h-[182px] mt-6 sm:mt-6 md:mt-16 text-center px-2 sm:px-0">
          <h1 className="text-lg sm:text-xl font-bold">
            {t("otp.title")}
          </h1>

          <p className="text-gray-600 mt-2 text-xs sm:text-sm leading-snug">
            {t("otp.description")}
          </p>

          <p className="text-sm text-myGray2 mt-2">
            {t("otp.sentTo")} <strong>{email}</strong>
          </p>

          <span className="text-lg sm:text-xl font-bold mt-3 sm:mt-4">
            {t("otp.code")}
          </span>
        </div>

        <form className="w-full flex flex-col items-center justify-center mt-4 sm:mt-6" onSubmit={handleSubmit}>
          <div className="flex justify-between mb-4 sm:mb-6 w-full max-w-[220px] sm:max-w-xs -mt-1">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                placeholder="0"
                maxLength={1}
                className="text-center w-9 h-9 sm:w-12 sm:h-11 text-base sm:text-lg font-bold rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-myYellow"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          {success && (
            <p className="text-green-500 text-sm mb-4 text-center">{success}</p>
          )}

          <Button
            type="submit"
            label={loading ? t("otp.verifying") || "Vérification..." : t("otp.verify")}
            className="w-full max-w-xs mb-2 sm:mb-4 mt-4"
            disabled={loading}
          />

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading}
            className="text-xs text-myBlack hover:text-myGray2 transition-colors duration-300 mt-2"
          >
            {t("otp.resend") || "Renvoyer le code"}
          </button>
        </form>
      </FormCard>
    </div>
  );
};

export default OtpPage;