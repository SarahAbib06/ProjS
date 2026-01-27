import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import FormCard from "../components/FormCard.jsx";
import InputField from "../components/InputField.jsx";
import Button from "../components/Button.jsx";
import LanguageToggle from "../components/LanguageToggle.jsx";
import ForgotPasswordModal from "../components/ForgotPasswordModal.jsx";
import { useTranslation } from "react-i18next";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // NE PAS effacer l'erreur ici - RETIREZ setError("")
  };

  const handleInputFocus = () => {
    // Effacer l'erreur seulement quand l'utilisateur clique sur un champ
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(formData);

      // Cas 1 : Connexion réussie directement
      if (response.token) {
        navigate("/MessagesPage");
      }
      // Cas 2 : Nécessite vérification OTP (inactivité)
      else if (response.requiresOtp) {
        navigate("/OtpPage", { 
          state: { 
            email: formData.email, 
            token: response.debug_token,
            type: 'inactivity',
            redirectTo: '/MessagesPage'  
          } 
        });
      }
    } catch (err) {
      setError(err.message || t("login.errors.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-myGray3 dark:bg-black px-4 relative py-6">
      <FormCard 
        title={t("login.welcome")} 
        subtitle={t("login.subtitle")} 
        topRight={<LanguageToggle />}
      >
        <form className="w-full mx-auto" onSubmit={handleSubmit}>
          <InputField
            type="email"
            name="email"
            placeholder={t("login.emailPlaceholder")}
            icon={<FaEnvelope />}
            value={formData.email}
            onChange={handleChange}
            onFocus={handleInputFocus} // <-- AJOUTEZ CETTE PROP
          />
          <InputField
            type="password"
            name="password"
            placeholder={t("login.passwordPlaceholder")}
            icon={<FaLock />}
            value={formData.password}
            onChange={handleChange}
            onFocus={handleInputFocus} // <-- AJOUTEZ CETTE PROP
          />

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">
              {error}
            </p>
          )}

          <p className="text-left text-sm mt-4 mb-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-myBlack cursor-pointer mt-2 mb-8 hover:text-myGray2 dark:text-myWhite  dark:hover:text-myGray2 transition-colors duration-300"
            >
              {t("login.forgotPassword")}
            </button>
          </p>

          <Button
            className="mt-7"
            type="submit"
            label={loading ? t("login.loading") || "Connexion..." : t("login.connect")}
            disabled={loading}
          />

          <p className="text-[12px] w-full sm:text-left text-center md:text-center mt-3 text-myBlack dark:text-myWhite">
            {t("login.noAccount")}{" "}
            <a href="/register" className="text-myBlack hover:text-myGray2 dark:text-myWhite dark:hover:text-myGray2  font-semibold">
              {t("login.register")}
            </a>
          </p>

          <div className="mt-4 h-15"></div>
        </form>
      </FormCard>

      <ForgotPasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Login;