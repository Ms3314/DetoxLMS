import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useLocalStorage } from "./hooks/useLocalStorage";
import FocusView from "./views/FocusView";
import VideosView from "./views/VideosView";
import ThoughtsView from "./views/ThoughtsView";
import TodosView from "./views/TodosView";
import { BRAND_NAME } from "./lib/brand";
import "./App.css";

// New keys only: the existing video keys (watched, notes, settings) are untouched.
const TODOS_KEY = "ytch-todos-v1";

const SECTIONS = [
  { path: "/", label: "Focus", end: true },
  { path: "/library", label: "Library" },
  { path: "/pages", label: "Pages" },
  { path: "/todos", label: "Todos" },
];

export default function App() {
  const [todos, setTodos] = useLocalStorage(TODOS_KEY, []);

  const badge = {
    "/todos": todos.filter((t) => !t.done).length,
  };

  return (
    <BrowserRouter>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">▶</span>
            <h1 className="brand-title">{BRAND_NAME}</h1>
          </div>

          <nav className="nav" aria-label="Sections">
            {SECTIONS.map((s) => (
              <NavLink
                key={s.path}
                to={s.path}
                end={s.end}
                className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
              >
                {s.label}
                {badge[s.path] > 0 && <span className="nav-count">{badge[s.path]}</span>}
              </NavLink>
            ))}
          </nav>
        </header>

        <div className="app-body">
          <Routes>
            <Route path="/" element={<FocusView />} />
            <Route path="/library" element={<VideosView />} />
            <Route path="/pages" element={<ThoughtsView />} />
            <Route
              path="/todos"
              element={<TodosView todos={todos} setTodos={setTodos} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
