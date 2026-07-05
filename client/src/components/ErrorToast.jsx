import React, { useEffect } from "react";
import { useGame } from "../state/GameContext.jsx";

export default function ErrorToast() {
  const { error, setError } = useGame();

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error, setError]);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[420px]">
      <div className="bg-sangre text-crema rounded-lg px-4 py-2 text-sm text-center shadow-lg">⚠️ {error}</div>
    </div>
  );
}
