import React, { useState, useEffect, useCallback } from 'react';
import './CareerDiscovery.css';
import {
  WORLDS, RAPID_FIRE, MISSIONS, REALITY_CHECKS,
  DOMAIN_QUESTIONS, CROSS_DOMAIN_MAP, CAREERS,
  addScores, getTopTags, getTraitLabels, getBestCareer,
} from './careerData';
import { saveCareerDiscoveryResult } from '../../services/assessmentService';
import FeatureGuard from '../../components/Common/FeatureGuard';

// ── Stage names for progress ────────────────────────────────────────────
const STAGES = [
  'hook', 'worlds', 'rapidfire', 'missions',
  'reveal', 'narrow', 'crossdomain', 'reality', 'result',
];
const STAGE_LABELS = [
  'Start', 'Choose Worlds', 'Rapid Fire', 'Missions',
  'Interest Reveal', 'Focus', 'Cross-Domain', 'Reality Check', 'Your Career',
];

// ── Confetti Component ──────────────────────────────────────────────────
function Confetti() {
  const colors = ['#a855f7', '#ec4899', '#f97316', '#22c55e', '#3b82f6', '#facc15'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
  return (
    <div className="cd-confetti">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="cd-confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            backgroundColor: p.color,
            width: p.size, height: p.size,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function CareerDiscovery({ onBack }) {
  const [stage, setStage] = useState('hook');
  const [animKey, setAnimKey] = useState(0);
  const [scores, setScores] = useState({});
  const [apiResult, setApiResult] = useState(null);

  // Stage-specific state
  const [selectedWorlds, setSelectedWorlds] = useState([]);
  const [rfIndex, setRfIndex] = useState(0);
  const [missionIndex, setMissionIndex] = useState(0);
  const [missionSelections, setMissionSelections] = useState({});
  const [narrowAnswers, setNarrowAnswers] = useState({});
  const [crossSelected, setCrossSelected] = useState([]);
  const [realityAnswers, setRealityAnswers] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Typing effect for hook
  const [hookText, setHookText] = useState('');
  const fullHookText = "You are entering a future world where your career defines your powers...";

  useEffect(() => {
    if (stage !== 'hook') return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setHookText(fullHookText.slice(0, i));
      if (i >= fullHookText.length) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [stage]);

  const goStage = useCallback((s) => {
    setAnimKey((k) => k + 1);
    setStage(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const stageIdx = STAGES.indexOf(stage);
  const progress = ((stageIdx) / (STAGES.length - 1)) * 100;

  // ── STAGE 1: World selection ────────────────────────────────────────────
  const toggleWorld = (id) => {
    setSelectedWorlds((prev) => {
      if (prev.includes(id)) return prev.filter((w) => w !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  // ── STAGE 2: Rapid fire ────────────────────────────────────────────────
  const handleRapidFire = (choice) => {
    const q = RAPID_FIRE[rfIndex];
    const tags = choice === 'a' ? q.a.tags : q.b.tags;
    setScores((prev) => addScores(prev, tags));
    if (rfIndex < RAPID_FIRE.length - 1) {
      setRfIndex(rfIndex + 1);
    } else {
      goStage('missions');
    }
  };

  // ── STAGE 3: Missions ─────────────────────────────────────────────────
  const handleMission = (mIdx, optIdx) => {
    const mission = MISSIONS[mIdx];
    const opt = mission.options[optIdx];
    setMissionSelections((prev) => ({ ...prev, [mIdx]: optIdx }));
    setScores((prev) => addScores(prev, opt.tags));
  };

  const canAdvanceMissions = Object.keys(missionSelections).length >= MISSIONS.length;

  // ── STAGE 5: Domain Narrowing ──────────────────────────────────────────
  const relevantDomains = selectedWorlds.filter((w) => DOMAIN_QUESTIONS[w]);

  const handleNarrowSelect = (worldId, optIdx) => {
    const opt = DOMAIN_QUESTIONS[worldId].options[optIdx];
    setNarrowAnswers((prev) => ({ ...prev, [worldId]: optIdx }));
    setScores((prev) => addScores(prev, opt.tags));
  };

  // ── STAGE 6: Cross Domain ──────────────────────────────────────────────
  const relevantCross = CROSS_DOMAIN_MAP.filter((c) =>
    selectedWorlds.some((w) => c.combo.includes(w))
  ).slice(0, 5);

  const toggleCross = (idx) => {
    setCrossSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
    const item = relevantCross[idx];
    if (item && CAREERS[item.tag]) {
      setScores((prev) => addScores(prev, { [item.tag]: 2 }));
    }
  };

  // ── STAGE 7: Reality Check ─────────────────────────────────────────────
  const handleReality = (tag, answer) => {
    setRealityAnswers((prev) => ({ ...prev, [tag]: answer }));
  };

  const allRealityDone = Object.keys(realityAnswers).length >= REALITY_CHECKS.length;

  // Compute results
  const topTags = getTopTags(scores, 3);
  const traitLabels = getTraitLabels(topTags);
  const { best: bestCareer, alternatives } = stage === 'result'
    ? getBestCareer(scores, realityAnswers)
    : { best: null, alternatives: [] };

  // ── STAGE 8: Final Result ──────────────────────────────────────────────
  const handleShowResult = async () => {
    setAnalyzing(true);
    
    // Pre-calculate fallback to save to backend
    const computedResults = getBestCareer(scores, realityAnswers);
    let finalBest = computedResults.best;
    let finalAlts = (computedResults.alternatives || []).map(a => `${a.emoji} ${a.title}`);
    
    try {
      const resp = await saveCareerDiscoveryResult({
        trait_labels: traitLabels,
        scores: scores,
        best_career_title: '',
        best_career_emoji: '',
        best_career_why: '',
        alternatives: []
      });
      const data = resp.data || resp;
      if (data && data.best_career_title) {
        finalBest = {
          title: data.best_career_title,
          emoji: data.best_career_emoji,
          why: data.best_career_why,
          task: data.task || "Start exploring this field today with a small project!"
        };
        finalAlts = data.alternatives || [];
      }
    } catch (error) {
      console.error("Failed to save/get AI career discovery results:", error);
    }

    setApiResult({ best: finalBest, alternatives: finalAlts });
    setAnalyzing(false);
    setShowConfetti(true);
    goStage('result');
    setTimeout(() => setShowConfetti(false), 4000);
  };

  // ── Render helpers ────────────────────────────────────────────────────

  // Analyzing screen
  if (analyzing) {
    return (
      <div className="career-discovery">
        <div className="cd-bg" />
        <div className="cd-content">
          <div className="cd-analyzing">
            <div className="cd-analyzing-ring" />
            <p className="cd-analyzing-text">🔮 Analyzing your unique powers...</p>
            <p className="cd-analyzing-sub">Matching you with your ideal career path</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="career-discovery">
      <div className="cd-bg" />
      {showConfetti && <Confetti />}

      <div className="cd-content">
        {/* Back button — Outside guard for accessibility */}
        {stage !== 'hook' && (
          <button className="cd-back-btn" onClick={onBack} style={{ zIndex: 100 }}>
            ← Back to Dashboard
          </button>
        )}

        <FeatureGuard feature="career_discovery" maybeLaterPath="/dashboard/teen">
          {/* Progress Bar */}
          {stage !== 'hook' && stage !== 'result' && (
            <div className="cd-progress-bar">
              <div className="cd-progress-track">
                <div className="cd-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="cd-progress-label">
                <span className="cd-progress-stage">{STAGE_LABELS[stageIdx]}</span>
                <span>Level {stageIdx}/{STAGES.length - 1}</span>
              </div>
            </div>
          )}

        {/* ═══════════ STAGE: HOOK ═══════════ */}
        {stage === 'hook' && (
          <div className="cd-stage-enter cd-hook" key={`hook-${animKey}`}>
            <div className="cd-hook-icon">🚀</div>
            <h1>Career Interest Discovery Journey</h1>
            <p className="cd-hook-subtitle">
              <span className="cd-hook-typing">{hookText}</span>
            </p>
            <button className="cd-btn-glow" onClick={() => goStage('worlds')}>
              ⚡ Enter the Portal
            </button>
            {onBack && (
              <button className="cd-btn-secondary" onClick={onBack}>
                ← Back to Dashboard
              </button>
            )}
          </div>
        )}

        {/* ═══════════ STAGE 1: WORLDS ═══════════ */}
        {stage === 'worlds' && (
          <div className="cd-stage-enter" key={`worlds-${animKey}`}>
            <div className="cd-section-header">
              <span className="cd-section-badge">⭐ Stage 1</span>
              <h2 className="cd-section-title">Choose Your Worlds</h2>
              <p className="cd-section-sub">Pick 2–3 worlds that excite you the most. No wrong answers!</p>
            </div>
            <div className="cd-worlds-grid">
              {WORLDS.map((w) => (
                <div
                  key={w.id}
                  className={`cd-world-card ${selectedWorlds.includes(w.id) ? 'selected' : ''}`}
                  onClick={() => toggleWorld(w.id)}
                >
                  <span className="cd-world-icon">{w.icon}</span>
                  <div className="cd-world-name">{w.name}</div>
                  <div className="cd-world-desc">{w.desc}</div>
                </div>
              ))}
            </div>
            <p className="cd-world-hint">
              {selectedWorlds.length}/3 worlds selected
              {selectedWorlds.length < 2 && ' — pick at least 2!'}
            </p>
            {selectedWorlds.length >= 2 && (
              <div className="cd-text-center cd-mt-2">
                <button className="cd-btn-glow cd-pulse" onClick={() => goStage('rapidfire')}>
                  Continue ⚡
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ STAGE 2: RAPID FIRE ═══════════ */}
        {stage === 'rapidfire' && (
          <div className="cd-stage-enter" key={`rf-${animKey}-${rfIndex}`}>
            <div className="cd-section-header">
              <span className="cd-section-badge">⚡ Stage 2</span>
              <h2 className="cd-section-title">Rapid Fire!</h2>
              <p className="cd-section-sub">Quick — pick the one you vibe with more. No overthinking!</p>
            </div>
            <div className="cd-rapidfire">
              <div className="cd-rapidfire-counter">
                {rfIndex + 1} / {RAPID_FIRE.length}
              </div>
              <div className="cd-rapidfire-vs">
                <div
                  className="cd-rapidfire-option left"
                  onClick={() => handleRapidFire('a')}
                >
                  <span className="cd-rapidfire-emoji">{RAPID_FIRE[rfIndex].a.emoji}</span>
                  <span className="cd-rapidfire-text">{RAPID_FIRE[rfIndex].a.text}</span>
                </div>
                <div className="cd-rapidfire-or">VS</div>
                <div
                  className="cd-rapidfire-option right"
                  onClick={() => handleRapidFire('b')}
                >
                  <span className="cd-rapidfire-emoji">{RAPID_FIRE[rfIndex].b.emoji}</span>
                  <span className="cd-rapidfire-text">{RAPID_FIRE[rfIndex].b.text}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ STAGE 3: MISSIONS ═══════════ */}
        {stage === 'missions' && (
          <div className="cd-stage-enter" key={`missions-${animKey}`}>
            <div className="cd-section-header">
              <span className="cd-section-badge">🧩 Stage 3</span>
              <h2 className="cd-section-title">Mini Missions</h2>
              <p className="cd-section-sub">Real scenarios, real choices. What would YOU do?</p>
            </div>
            {MISSIONS.map((m, mIdx) => (
              <div className="cd-mission" key={mIdx}>
                <div className="cd-mission-scenario">{m.scenario}</div>
                <div className="cd-mission-options">
                  {m.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`cd-mission-option ${missionSelections[mIdx] === oIdx ? 'selected' : ''}`}
                      onClick={() => handleMission(mIdx, oIdx)}
                    >
                      <span className="cd-mission-emoji">{opt.emoji}</span>
                      {opt.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {canAdvanceMissions && (
              <div className="cd-text-center cd-mt-2">
                <button className="cd-btn-glow cd-pulse" onClick={() => goStage('reveal')}>
                  See What You Are ✨
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ STAGE 4: INTEREST REVEAL ═══════════ */}
        {stage === 'reveal' && (
          <div className="cd-stage-enter" key={`reveal-${animKey}`}>
            <div className="cd-section-header">
              <span className="cd-section-badge">🔍 Mid-Result</span>
              <h2 className="cd-section-title">You Are A Mix Of...</h2>
            </div>
            <div className="cd-reveal-card">
              <div className="cd-reveal-label">Your Unique Profile</div>
              <div className="cd-reveal-traits">
                {traitLabels.map((label, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="cd-reveal-plus">+</span>}
                    <span className="cd-reveal-trait">{label}</span>
                  </React.Fragment>
                ))}
              </div>
              <p className="cd-reveal-subtitle">
                This is just the beginning! Let's dig deeper to find your perfect career...
              </p>
            </div>
            <div className="cd-text-center">
              <button className="cd-btn-glow" onClick={() => goStage('narrow')}>
                Let's Go Deeper 🚀
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STAGE 5: DOMAIN NARROWING ═══════════ */}
        {stage === 'narrow' && (
          <div className="cd-stage-enter" key={`narrow-${animKey}`}>
            <div className="cd-section-header">
              <span className="cd-section-badge">🚀 Stage 5</span>
              <h2 className="cd-section-title">Focus Your Powers</h2>
              <p className="cd-section-sub">Based on your worlds, pick what calls to you in each domain</p>
            </div>
            {relevantDomains.map((worldId) => {
              const dq = DOMAIN_QUESTIONS[worldId];
              return (
                <div key={worldId} className="cd-mb-2">
                  <h3 style={{ color: '#c084fc', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>
                    {dq.question}
                  </h3>
                  <div className="cd-narrow-grid">
                    {dq.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`cd-narrow-option ${narrowAnswers[worldId] === oIdx ? 'selected' : ''}`}
                        onClick={() => handleNarrowSelect(worldId, oIdx)}
                      >
                        <span className="cd-narrow-emoji">{opt.emoji}</span>
                        <span className="cd-narrow-label">{opt.text}</span>
                        <span className="cd-narrow-desc">{opt.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {Object.keys(narrowAnswers).length >= relevantDomains.length && relevantDomains.length > 0 && (
              <div className="cd-text-center cd-mt-2">
                <button className="cd-btn-glow cd-pulse" onClick={() => goStage('crossdomain')}>
                  Discover Hybrid Paths 🌐
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ STAGE 6: CROSS DOMAIN ═══════════ */}
        {stage === 'crossdomain' && (
          <div className="cd-stage-enter" key={`cross-${animKey}`}>
            <div className="cd-section-header">
              <span className="cd-section-badge">🌐 Stage 6</span>
              <h2 className="cd-section-title">Cross-Domain Magic</h2>
              <p className="cd-section-sub">The best careers combine multiple passions. Do any of these spark joy?</p>
            </div>
            <div className="cd-cross-list">
              {relevantCross.map((c, idx) => (
                <div
                  key={idx}
                  className={`cd-cross-card ${crossSelected.includes(idx) ? 'selected' : ''}`}
                  onClick={() => toggleCross(idx)}
                >
                  <span className="cd-cross-emoji">{c.emoji}</span>
                  <div className="cd-cross-info">
                    <div className="cd-cross-title">{c.title}</div>
                    <div className="cd-cross-formula">{c.formula}</div>
                    <div className="cd-cross-desc">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cd-text-center cd-mt-3">
              <button className="cd-btn-glow" onClick={() => goStage('reality')}>
                Almost There! 🧪
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STAGE 7: REALITY CHECK ═══════════ */}
        {stage === 'reality' && (
          <div className="cd-stage-enter" key={`reality-${animKey}`}>
            <div className="cd-section-header">
              <span className="cd-section-badge">🧪 Stage 7</span>
              <h2 className="cd-section-title">Quick Reality Check</h2>
              <p className="cd-section-sub">Be honest — this helps us find the BEST fit for the real you</p>
            </div>
            <div className="cd-reality-list">
              {REALITY_CHECKS.map((rc) => (
                <div className="cd-reality-card" key={rc.tag}>
                  <div className="cd-reality-question">{rc.emoji} {rc.q}</div>
                  <div className="cd-reality-options">
                    {['yes', 'maybe', 'no'].map((ans) => (
                      <button
                        key={ans}
                        className={`cd-reality-btn ${realityAnswers[rc.tag] === ans ? `selected-${ans}` : ''}`}
                        onClick={() => handleReality(rc.tag, ans)}
                      >
                        {ans === 'yes' ? '👍 Yes' : ans === 'maybe' ? '🤷 Maybe' : '👎 Nah'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {allRealityDone && (
              <div className="cd-text-center cd-mt-3">
                <button className="cd-btn-glow cd-pulse" onClick={handleShowResult}>
                  🎯 Reveal My Career
                </button>
              </div>
            )}
          </div>
        )}

          {/* ═══════════ STAGE 8: FINAL RESULT ═══════════ */}
          {stage === 'result' && apiResult?.best && (
            <div className="cd-stage-enter cd-result" key={`result-${animKey}`}>
              {/* ... result content ... */}
              <div className="cd-result-trophy">🏆</div>
              <div className="cd-result-title-label">🎯 Your Best Career Match</div>
              <h2 className="cd-result-career">
                {apiResult.best.emoji} {apiResult.best.title}
              </h2>

              <div className="cd-result-why">
                <div className="cd-result-why-label">💡 Why This Fits You</div>
                <p className="cd-result-why-text">{apiResult.best.why}</p>
              </div>

              {apiResult.alternatives?.length > 0 && (
                <div className="cd-result-alternatives">
                  <div className="cd-result-alt-label">🔁 Alternative Paths</div>
                  <div className="cd-result-alt-list">
                    {apiResult.alternatives.map((alt, i) => (
                      <span className="cd-result-alt-tag" key={i}>
                        {alt}
                      </span>
                    ))}
                    {apiResult.best.alts?.map((a, i) => (
                      <span className="cd-result-alt-tag" key={`sub-${i}`}>✦ {a}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="cd-result-bonus">
                <div className="cd-result-bonus-label">🎁 Try-It-Now Challenge</div>
                <p className="cd-result-bonus-text">{apiResult.best.task}</p>
              </div>

              <div className="cd-result-actions">
                <button className="cd-btn-glow" onClick={onBack}>
                  🏠 Back to Dashboard
                </button>
                <button
                  className="cd-btn-secondary"
                  onClick={() => {
                    setStage('hook');
                    setApiResult(null);
                    setScores({});
                    setSelectedWorlds([]);
                    setRfIndex(0);
                    setMissionIndex(0);
                    setMissionSelections({});
                    setNarrowAnswers({});
                    setCrossSelected([]);
                    setRealityAnswers({});
                  }}
                >
                  🔄 Retake Journey
                </button>
              </div>
            </div>
          )}
        </FeatureGuard>
      </div>
    </div>
  );
}
