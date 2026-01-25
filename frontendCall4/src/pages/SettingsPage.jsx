import { useState, useEffect } from "react";
import ParametresMenu from "../components/ParametresMenu";
import ParametresGeneral from "../components/ParametresGenral";
import ParametresConfidentialite from "../components/ParametresConfidentialite";
import DerniereConnexion from "../components/DerniereConnexion";
import Statut from "../components/Statut";
import Profile from "../components/Profile";
import UtilisateursBloques from "../components/UtilisateursBloques";
import ModifierMotDePasse from "../components/ModefierMotDePasse";
import ParametresNotification from "../components/ParametresNotification";
import BanniereNotification from "../components/BanniereNotification";






export default function SettingsPage() {
  const isDesktopInit = window.innerWidth >= 1024;
  const [isDesktop, setIsDesktop] = useState(isDesktopInit);




  const [selectedMenu, setSelectedMenu] = useState(
    isDesktopInit ? "general" : null 
  );
  
  // Variable séparée pour les sous-pages de confidentialité
  const [privacySubPage, setPrivacySubPage] = useState(null);

  const [dernierConnexionChoice, setDernierConnexionChoice] = useState("Personne");
  const [statutChoice, setStatutChoice] = useState("Personne");
const [notifSubPage, setNotifSubPage] = useState(null);
const [bannerSelection, setBannerSelection] = useState("always");

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen p-6 gap-6 bg-myGray dark:bg-mydarkWhite flex-col lg:flex-row">

      {isDesktop && (
        <div className="w-auto">
          <ParametresMenu selected={selectedMenu} setSelected={setSelectedMenu} />
        </div>
      )}

      <div className="flex-1">

        {!isDesktop && selectedMenu === null && (
          <ParametresMenu selected={selectedMenu} setSelected={setSelectedMenu} />
        )}

        {selectedMenu === "general" && (
          <ParametresGeneral setSelectedMenu={setSelectedMenu} />
        )}

        {selectedMenu === "profil" && (
          <Profile setSelectedMenu={setSelectedMenu} />
        )}

        {/* CONFIDENTIALITÉ avec sous-pages */}
        {selectedMenu === "privacy" && (
          <>
            {privacySubPage === null && (
              <ParametresConfidentialite
                setSelectedMenu={setSelectedMenu}
                setPrivacySubPage={setPrivacySubPage}
                dernierConnexionChoice={dernierConnexionChoice}
                statutChoice={statutChoice}
              />
            )}

            {privacySubPage === "lastLogin" && (
              <DerniereConnexion
                setSelectedMenu={setSelectedMenu}
                setPrivacySubPage={setPrivacySubPage}
                selection={dernierConnexionChoice}
                setSelection={setDernierConnexionChoice}
              />
            )}

            {privacySubPage === "statut" && (
              <Statut
                setSelectedMenu={setSelectedMenu}
                setPrivacySubPage={setPrivacySubPage}
                selection={statutChoice}
                setSelection={setStatutChoice}
              />
            )}

            {privacySubPage === "ModefierMotDePasse" && (
              <ModifierMotDePasse 
                setSelectedMenu={setSelectedMenu}
                setPrivacySubPage={setPrivacySubPage}
              />
            )}

            {privacySubPage === "blockedUsers" && (
              <UtilisateursBloques 
                setSelectedMenu={setSelectedMenu}
                setPrivacySubPage={setPrivacySubPage}
              />
            )}
          </>
        )}


          {/* NOTIFICATIONS */}
{selectedMenu === "notif" && (
  <>
    {notifSubPage === null && (
      <ParametresNotification
        setSelectedMenu={setSelectedMenu}
        setNotifSubPage={setNotifSubPage}
        bannerSelection={bannerSelection}
        setBannerSelection={setBannerSelection}
      />
    )}

    {notifSubPage === "banner" && (
      <BanniereNotification
        setNotifSubPage={setNotifSubPage}
        selection={bannerSelection}
        setSelection={setBannerSelection}
      />
    )}
  </>
)}

      </div>
    </div>
  );
}