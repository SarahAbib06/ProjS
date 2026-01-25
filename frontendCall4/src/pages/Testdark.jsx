// App.jsx
import { useState } from "react";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <html className={darkMode ? "dark" : ""}>
      <body className="min-h-screen flex flex-col items-center justify-center bg-myGray text-myBlack dark:bg-mydarkGray dark:text-mydarkWhite transition-colors duration-300">
        <h1 className="text-3xl font-bold mb-6">Test Light / Dark Mode</h1>
        <div className="p-6 rounded-lg shadow-lg bg-myYellow text-myBlack dark:bg-mydarkYellow dark:text-mydarkBlack transition-colors duration-300">
          Contenu du card
        </div>
        <button
          onClick={toggleDarkMode}
          className="mt-6 px-4 py-2 bg-myBlack text-myWhite dark:bg-mydarkBlack dark:text-mydarkWhite rounded-lg transition-colors duration-300"
        >
          {darkMode ? "Passer en Light Mode" : "Passer en Dark Mode"}
        </button>
      </body>
    </html>
  );
}

export default App;
