// src/components/FormCard.jsx
import { useTranslation } from "react-i18next";
import logo from "../assets/images/owlylogo.png";

<img src={logo} alt="logo" />

const FormCard = ({ title, subtitle, children, topRight }) => {
  const { t } = useTranslation();

  return (
    <div  
    className="
      bg-white dark:bg-mydarkGray3 shadow-lg rounded-2xl 
      flex flex-col md:flex-row
      min-h-0
         w-[92%]          /*  plus large sur mobile */
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

      {/* 🔹 Bouton responsive (mobile = dans le jaune / desktop = dans le blanc) */}
      {topRight && (
        <div className="absolute top-4 right-4 z-20">
          {topRight}
        </div>
      )}

      {/* Partie gauche */}
      <div className="bg-myYellow md:w-1/2 w-full relative flex justify-center items-center h-[70px]  xs:h-[100px]   sm:h-[130px] md:h-auto p-2 md:p-4 text-center rounded-xl m-0 md:m-2">
        <div className="inset-0 flex justify-center items-center md:-mt-30">
          <img
            src={logo}
            alt="Logo"
            className="w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] md:w-[400px] md:h-[400px] object-contain"
          />
        </div>

        <div className="hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] text-left">
          <p className="text-xs sm:text-sm text-myBlack font-medium">
            {t('formCard.leftText1')}
          </p>
          <p className="text-xs sm:text-sm  dark:text-myBlack font-semibold mt-2">
            {t('formCard.leftText2')}
          </p>
        </div>
      </div>

      {/* Partie droite */}
      <div className="md:w-1/2 w-full flex flex-col justify-center 
                items-center md:items-start min-h-0
                p-4 sm:p-6 md:p-8 relative">
        <h2 className="text-2xl sm:text-2xl font-semibold mb-2 text-center md:text-left">{title}</h2>
        <p className="text-[14px] text-myBlack  dark:text-myWhite mb-6 text-center md:text-left">{subtitle}</p>
        {children} 
      </div>

    </div>
  );
};

export default FormCard;
