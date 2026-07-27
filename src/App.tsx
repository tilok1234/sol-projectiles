import { useState } from "react";
import { CombatLab } from "./ui/CombatLab";
import { EffectAuthor } from "./ui/EffectAuthor";
import { PackReview } from "./ui/PackReview";

type AppView = "author" | "lab" | "pack";

export default function App() {
  const [view, setView] = useState<AppView>("author");
  const [selectedId, setSelectedId] = useState("hostile.predictive-orb");

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark" aria-hidden="true">
            <i /><i /><i /><i /><i />
          </span>
          <span>
            <strong>TileForge</strong>
            <small>Effect Forge</small>
          </span>
        </a>
        <nav className="main-tabs" aria-label="Primary views">
          <button className={view === "author" ? "active" : ""} onClick={() => setView("author")}>
            <span>01</span> Effect Author
          </button>
          <button className={view === "lab" ? "active" : ""} onClick={() => setView("lab")}>
            <span>02</span> Combat Lab
          </button>
          <button className={view === "pack" ? "active" : ""} onClick={() => setView("pack")}>
            <span>03</span> Pack Review
          </button>
        </nav>
        <div className="header-status">
          <span className="pulse" />
          <div><strong>0.1.0 internal slice</strong><small>EF-0 candidate · no visual approval</small></div>
        </div>
      </header>

      <div className="context-bar">
        <span><b>PACK</b> tier1-internal-slice</span>
        <span><b>INK</b> #1C1520 observed</span>
        <span><b>RAMP</b> candidate</span>
        <span><b>ACTORS</b> v2.3.0</span>
        <span><b>PX/TILE</b> 16</span>
        <span className="context-note">Engine-neutral · binary alpha · normal blend</span>
      </div>

      <div className="app-content">
        {view === "author" && (
          <EffectAuthor selectedId={selectedId} onSelectedId={setSelectedId} />
        )}
        {view === "lab" && <CombatLab />}
        {view === "pack" && <PackReview />}
      </div>

      <footer className="app-footer">
        <span>Deterministic recipe renderer</span>
        <span>Proxy fixtures are labelled</span>
        <span>Structural success ≠ visual acceptance</span>
      </footer>
    </div>
  );
}
