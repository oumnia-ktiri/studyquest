import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="fixed top-4 right-4 rounded-full bg-white px-4 py-2 text-sm shadow dark:bg-slate-800"
    >
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}