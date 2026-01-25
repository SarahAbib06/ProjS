// frontend/src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import FormCard from "../components/FormCard.jsx";
import InputField from "../components/InputField.jsx";
import Checkbox from "../components/Chekbox.jsx";
import Button from "../components/Button.jsx";
import LanguageToggle from"../components/LanguageToggle.jsx";
import { useTranslation } from "react-i18next";

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: ""
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.passwordConfirm) {
      setError(t("register.errors.allFieldsRequired") || "Tous les champs sont requis");
      return;
    }

    if (!acceptTerms) {
      setError(t("register.errors.acceptTerms") || "Vous devez accepter les conditions");
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError(t("register.errors.passwordMismatch") || "Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      // Rediriger vers la page OTP avec l'email
      navigate("/OtpPage", { 
        state: { 
          email: formData.email,
          type: 'register',
          redirectTo: '/login' // Redirige vers login après OTP
        } 
      });
    } catch (err) {
      setError(err.message || t("register.errors.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-myGray3 relative px-4">
      <div className="flex justify-center items-center min-h-screen">
        <FormCard
          title={t("register.createAccount")}
          subtitle={t("register.subtitle")}
            topRight={<LanguageToggle />}
        >
          <form className="w-full mx-auto" onSubmit={handleSubmit}>
            <InputField
              type="text"
              name="username"
              placeholder={t("register.username")}
              icon={<FaUser />}
              value={formData.username}
              onChange={handleChange}
            />
            <InputField
              type="email"
              name="email"
              placeholder={t("register.email")}
              icon={<FaEnvelope />}
              value={formData.email}
              onChange={handleChange}
            />
            <InputField
              type="password"
              name="password"
              placeholder={t("register.password")}
              icon={<FaLock />}
              value={formData.password}
              onChange={handleChange}
            />
            <InputField
              type="password"
              name="passwordConfirm"
              placeholder={t("register.confirmPassword")}
              icon={<FaLock />}
              value={formData.passwordConfirm}
              onChange={handleChange}
            />

            {error && (
              <p className="text-red-500 text-sm text-center mb-4">
                {error}
              </p>
            )}

            <Checkbox
              
              label={t("register.acceptTerms")}
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />

            <Button
              type="submit"
              label={loading ? t("register.loading") || "Inscription..." : t("register.signUp")}
              disabled={loading}
            />

            <p className="text-[12px] text-center mt-3 text-myBlack dark:text-myWhite">
              {t("register.alreadyHaveAccount")}{" "}
              <a href="/login" className="text-myBlack hover:text-myGray2 dark:text-myWhite dark:hover:text-myGray2 font-semibold">
                {t("register.login")}
              </a>
            </p>
          </form>
        </FormCard>
      </div>
    </div>
  );
};

export default Register;