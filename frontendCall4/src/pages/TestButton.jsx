import { Button } from "../components/ui/button.jsx";

export default function TestButton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">
          Test du bouton Shadcn 🚀
        </h1>
        <Button onClick={() => alert("Bouton Shadcn fonctionne ✅")}>
          Clique-moi
        </Button>
      </div>
    </div>
  );
}
