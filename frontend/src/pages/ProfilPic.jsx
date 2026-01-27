import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormCard from "../components/FormCard.jsx";
import Button from "../components/Button.jsx";
import LanguageToggle from "../components/LanguageToggle.jsx";
import { useTranslation } from "react-i18next";
import { profileService } from "../services/profileService";

const ProfilPic = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null); // vrai fichier
  const [preview, setPreview] = useState(null); // aperçu image
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = location.state?.redirectTo || '/MessagesPage';

  // choisir image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  // upload + redirection login
  const handleChoose = async () => {
    if (!selectedFile) {
      setError(t("profilPic.noImage") || "Veuillez choisir une image");
      return;
    }

    setLoading(true);
    try {
      await profileService.uploadProfilePicture(selectedFile);
        setTimeout(() => navigate(redirectTo), 1500);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l’envoi de la photo");
    } finally {
      setLoading(false);
    }
  };

  // ignorer
  const handleIgnore = () => {
    setTimeout(() => navigate(redirectTo), 1500);
  };

  return (
    <div className="min-h-screen bg-myGray3 dark:bg-black relative px-4">
      <div className="flex justify-center items-center min-h-screen">
        <FormCard
          title={t("profilPic.title")}
          subtitle={t("profilPic.subtitle")}
          topRight={<LanguageToggle />}
          className="w-full max-w-md min-h-[500px]"
        >
          <div className="flex flex-col items-center mt-6 sm:mt-10">
            {/* Cercle photo */}
            <label className="cursor-pointer">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-2 border-myYellow flex items-center justify-center overflow-hidden text-gray-400 font-semibold">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  t("profilPic.chooseImage")
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {error && (
              <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
            )}

            {/* Boutons */}
            <div className="flex gap-4 mt-6 sm:mt-8 w-full max-w-xs">
              <Button
                type="button"
                label={loading ? "..." : t("profilPic.choose")}
                className="flex-1"
                onClick={handleChoose}
                disabled={loading}
              />
              <Button
                type="button"
                label={t("profilPic.ignore")}
                className="flex-1 bg-gray-200 text-myBlack"
                onClick={handleIgnore}
                disabled={loading}
              />
            </div>
          </div>
        </FormCard>
      </div>
    </div>
  );
};

export default ProfilPic;