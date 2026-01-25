import { useTranslation } from "react-i18next";

// Couleurs simples
const COLORS = [
  { name: "Jaune", value: "#FBE186" },
  { name: "Bleu", value: "#87CEEB" },
  { name: "Vert", value: "#A6E4A6" },
  { name: "Rose", value: "#FFB6C1" },
  { name: "Rouge", value: "#FF7F7F" },
  { name: "Violet", value: "#B39DDB" },
  { name: "Orange", value: "#FFB347" },
  { name: "Turquoise", value: "#7FDBFF" },
  { name: "Gris", value: "#D3D3D3" },
  { name: "Beige", value: "#F5E8C7" },
  { name: "Soleil Doux", value: "#FFF9C4" },
  { name: "Blanc", value: "#FFFFFF" },
];

// Gradients
const GRADIENTS = [
  { name: "Bleu → Rose", value: "linear-gradient(135deg,#8EC5FC,#E0C3FC)" },
  { name: "Violet → Bleu", value: "linear-gradient(135deg,#6A5ACD,#00BFFF)" },
  { name: "Orange → Rouge", value: "linear-gradient(135deg,#FF9A8B,#FF6A88,#FF99AC)" },
  { name: "Bleu → Turquoise", value: "linear-gradient(135deg,#4facfe,#00f2fe)" },
  { name: "Rose → Violet", value: "linear-gradient(135deg,#fcb1e2,#9c7af2)" },
  { name: "Jaune → Orange", value: "linear-gradient(135deg,#f6d365,#fda085)" },
  { name: "Vert → Bleu", value: "linear-gradient(135deg,#A6FFCB,#12D8FA)" },
  { name: "Rouge → Violet", value: "linear-gradient(135deg,#ff9a9e,#8e44ad)" },
  { name: "Gris → Noir", value: "linear-gradient(135deg,#bdc3c7,#2c3e50)" },
  { name: "Bleu Lavande", value: "linear-gradient(135deg,#6a11cb,#2575fc)" },
  { name: "Pêche → Rose", value: "linear-gradient(135deg,#FFD3A5,#FD6585)" },
  { name: "Arc-en-ciel doux", value: "linear-gradient(135deg,#f6d365,#fda085,#fcb1e2,#a1c4fd,#c2e9fb)" },
];

// Thèmes saisonniers (emoji inclus)
const SEASONAL = [
  { name: "Saint Valentin", value: "#FFB6C1", type: "seasonal", emoji: "💖" },
  { name: "Neige", value: "#D3E9FF", type: "seasonal", emoji: "☃️" },
  { name: "Halloween", value: "#FF8C42", type: "seasonal", emoji: "🎃" },
  { name: "Noël", value: "#228B22", type: "seasonal", emoji: "❄️" },
];

// Helper pour foncer les couleurs simples et saisonnelles
function darkenColor(hex, percent = 0.25) {
  if (!hex.startsWith("#")) return hex;
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.floor(r * (1 - percent));
  g = Math.floor(g * (1 - percent));
  b = Math.floor(b * (1 - percent));
  return `rgb(${r},${g},${b})`;
}

export default function ThemeSelector({ isDark, onSelectTheme, onRemoveTheme, onClose }) {
  const { t } = useTranslation();

  // Fonction pour foncer une couleur en dark mode
  const getThemeStyle = (theme) => {
    if (theme.type === "color" || theme.type === "seasonal") {
      return { backgroundColor: isDark ? darkenColor(theme.value) : theme.value };
    }
    if (theme.type === "gradient") {
      return { backgroundImage: theme.value, filter: isDark ? "brightness(0.6)" : "none" };
    }
    return {};
  };

  return (
    <div
      className="fixed top-16 right-2 z-50 w-[90vw] max-w-[18rem] p-3 bg-white dark:bg-neutral-800 shadow-xl rounded-xl sm:right-4 sm:w-72"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Couleurs simples */}
      <h3 className="font-semibold mb-2 text-sm">{t("themeSelector.simpleColors")}</h3>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
        {COLORS.map((c) => (
          <button
            key={c.name}
            className="w-10 h-10 rounded-lg border border-gray-300 dark:border-neutral-700"
            style={getThemeStyle({ type: "color", value: c.value })}
            onClick={() => onSelectTheme({ type: "color", value: c.value })}
            title={t(`colors.${c.name}`)}
          />
        ))}
      </div>

      {/* Gradients */}
      <h3 className="font-semibold mb-2 text-sm">{t("themeSelector.gradients")}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
        {GRADIENTS.map((g) => (
          <button
            key={g.name}
            className="w-10 h-10 rounded-lg border border-gray-300 dark:border-neutral-700"
            style={getThemeStyle({ type: "gradient", value: g.value })}
            onClick={() => onSelectTheme({ type: "gradient", value: g.value })}
            title={t(`gradients.${g.name}`)}
          />
        ))}
      </div>

      {/* Thèmes saisonniers */}
      <h3 className="font-semibold mb-2 text-sm">{t("themeSelector.saison", "Saison")}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
        {SEASONAL.map((s) => (
          <button
            key={s.name}
            className="w-10 h-10 rounded-lg border border-gray-300 dark:border-neutral-700 flex items-center justify-center text-xl"
            style={getThemeStyle(s)}
            onClick={() =>
              onSelectTheme({
                type: s.type,
                value: s.value,
                emoji: s.emoji, // ← IMPORTANT (emoji sauvegardé)
              })
            }
            title={`${t(s.name)} ${s.emoji}`}
          >
            {s.emoji}
          </button>
        ))}
      </div>

      {/* Upload image */}
      <div className="mb-4">
        <label className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs cursor-pointer">
          {t("themeSelector.chooseImage")}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) onSelectTheme({ type: "upload", value: file });
            }}
          />
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs"
          onClick={onRemoveTheme}
        >
          {t("themeSelector.removeTheme")}
        </button>
        <button
          className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs"
          onClick={onClose}
        >
          {t("themeSelector.close")}
        </button>
      </div>
    </div>
  );
}

