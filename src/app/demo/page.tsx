"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

// ─── Types ───

type Strategy =
  | "css"
  | "naiveWindowCheck"
  | "useIsMobile"
  | "useCurrentBreakpoint";

const PHASES = [
  "Server Render",
  "Network",
  "HTML Visible",
  "JS Loads",
  "Hydration",
  "useEffect",
  "Interactive",
] as const;

type Phase = (typeof PHASES)[number];

// ─── Mock UI: Patreon Insights page ───

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      {trend && <div className={styles.statTrend}>{trend}</div>}
    </div>
  );
}

function MobileLayout() {
  return (
    <div className={styles.mockPage}>
      <div className={styles.mockNavbar}>
        <span className={styles.mockLogo}>patreon</span>
        <div className={styles.mockHamburger}>
          <div className={styles.mockHamburgerLine} />
          <div className={styles.mockHamburgerLine} />
          <div className={styles.mockHamburgerLine} />
        </div>
      </div>
      <div className={styles.pageTitle}>Insights</div>
      <div className={styles.statStack}>
        <StatCard label="Active patrons" value="1,247" trend="+12%" />
        <StatCard label="Monthly revenue" value="$8,430" trend="+3%" />
      </div>
      <div className={styles.chartBlock}>
        <div className={styles.chartLabel}>Revenue — last 30 days</div>
        <div className={styles.chartArea}>
          <div className={styles.chartLine} />
        </div>
      </div>
    </div>
  );
}

function DesktopLayout() {
  return (
    <div className={styles.mockPage}>
      <div className={styles.mockNavbar}>
        <span className={styles.mockLogo}>patreon</span>
        <div className={styles.mockLinks}>
          <span className={styles.mockLink}>Home</span>
          <span className={styles.mockLinkActive}>Insights</span>
          <span className={styles.mockLink}>Payouts</span>
          <span className={styles.mockLink}>Settings</span>
        </div>
      </div>
      <div className={styles.pageTitle}>Insights</div>
      <div className={styles.statRow}>
        <StatCard label="Active patrons" value="1,247" trend="+12%" />
        <StatCard label="Monthly revenue" value="$8,430" trend="+3%" />
        <StatCard label="New patrons" value="64" trend="+8%" />
        <StatCard label="Churn" value="2.1%" trend="-0.3%" />
      </div>
      <div className={styles.chartBlock}>
        <div className={styles.chartLabel}>Revenue — last 30 days</div>
        <div className={styles.chartArea}>
          <div className={styles.chartLine} />
        </div>
      </div>
    </div>
  );
}

function SkeletonLayout() {
  return (
    <div className={styles.mockPage}>
      <div className={styles.skeletonBar}>
        <div className={styles.skeletonBlock} style={{ width: 60 }} />
        <div className={styles.skeletonBlock} style={{ width: 120 }} />
      </div>
      <div className={styles.skeletonBlock} style={{ width: 80, height: 16 }} />
      <div className={styles.skeletonStatRow}>
        <div className={styles.skeletonStatCard} />
        <div className={styles.skeletonStatCard} />
        <div className={styles.skeletonStatCard} />
      </div>
      <div className={styles.skeletonChart} />
    </div>
  );
}

function CssBothLayouts({
  activeMobile,
  showBoth,
}: {
  activeMobile: boolean;
  showBoth?: boolean;
}) {
  const desktopClass = showBoth
    ? styles.cssLayoutActive
    : activeMobile
      ? styles.cssLayoutHidden
      : styles.cssLayoutActive;
  const mobileClass = showBoth
    ? styles.cssLayoutActive
    : activeMobile
      ? styles.cssLayoutActive
      : styles.cssLayoutHidden;

  return (
    <div className={styles.cssBothLayouts}>
      <div>
        <div className={styles.cssLayoutTag}>
          {'<div class="desktop-only">'}
        </div>
        <div className={desktopClass}>
          <DesktopLayout />
        </div>
      </div>
      <div>
        <div className={styles.cssLayoutTag}>{'<div class="mobile-only">'}</div>
        <div className={mobileClass}>
          <MobileLayout />
        </div>
      </div>
    </div>
  );
}

// ─── Panel content logic ───

function getServerContent(
  strategy: Strategy,
  serverMobile: boolean,
  phase: Phase | null,
) {
  // Server panel populates at "Server Render" and stays
  if (phase === null) return <div className={styles.mockEmpty}>Waiting…</div>;

  if (strategy === "css") {
    return <CssBothLayouts activeMobile={serverMobile} showBoth />;
  }
  if (strategy === "useCurrentBreakpoint") {
    return <SkeletonLayout />;
  }
  // naiveWindowCheck and useIsMobile: server guesses
  return serverMobile ? <MobileLayout /> : <DesktopLayout />;
}

function getClientContent(
  strategy: Strategy,
  serverMobile: boolean,
  clientMobile: boolean,
  phase: Phase | null,
) {
  // Before "HTML Visible", client has nothing
  if (phase === null) return <div className={styles.mockEmpty}>Waiting…</div>;

  const phaseIndex = PHASES.indexOf(phase);
  const htmlVisibleIndex = PHASES.indexOf("HTML Visible");
  const hydrationIndex = PHASES.indexOf("Hydration");
  const useEffectIndex = PHASES.indexOf("useEffect");

  if (phaseIndex < htmlVisibleIndex) {
    return <div className={styles.mockEmpty}>Waiting…</div>;
  }

  // CSS strategy: browser evaluates media queries immediately
  if (strategy === "css") {
    return <CssBothLayouts activeMobile={clientMobile} />;
  }

  // naiveWindowCheck: diverges at Hydration — reads window during render
  if (strategy === "naiveWindowCheck") {
    if (phaseIndex < hydrationIndex) {
      return serverMobile ? <MobileLayout /> : <DesktopLayout />;
    }
    // At hydration and beyond: client renders the real value, disagreeing with server
    return clientMobile ? <MobileLayout /> : <DesktopLayout />;
  }

  // useIsMobile: matches server guess until useEffect
  if (phaseIndex < useEffectIndex) {
    if (strategy === "useCurrentBreakpoint") {
      return <SkeletonLayout />;
    }
    return serverMobile ? <MobileLayout /> : <DesktopLayout />;
  }

  // After useEffect: client resolves to truth
  return clientMobile ? <MobileLayout /> : <DesktopLayout />;
}

// ─── Annotations ───

function getAnnotation(
  strategy: Strategy,
  serverMobile: boolean,
  clientMobile: boolean,
  phase: Phase | null,
): string {
  if (phase === null)
    return "Click a phase to step through what happens between a server render and an interactive page.";

  const mismatch = serverMobile !== clientMobile;
  const serverLabel = serverMobile ? "mobile" : "desktop";
  const clientLabel = clientMobile ? "mobile" : "desktop";

  switch (phase) {
    case "Server Render":
      if (strategy === "css")
        return "The server renders both layouts into the HTML — mobile and desktop markup side by side. It doesn't need to know the viewport because CSS will sort it out on the client.";
      if (strategy === "useCurrentBreakpoint")
        return "The server can't know the viewport, so instead of guessing wrong it renders a skeleton. This is an intentional placeholder — the real layout will appear once JS runs.";
      if (strategy === "naiveWindowCheck")
        return `The server has no window object, so typeof window === "undefined" — it falls through to the ${serverLabel} default. The problem: the client will check window.innerWidth during render and may get a different answer.`;
      return `The server has no window object — it can't measure the viewport. So it guesses: "${serverLabel}." If that guess is wrong, the user will see the wrong layout until JS corrects it.`;

    case "Network":
      return "The HTML is in flight. Everything the user will see for the next few hundred milliseconds was already decided on the server. On slow connections, the wrong guess stays on screen longer.";

    case "HTML Visible":
      if (strategy === "css")
        return `✅ The browser paints the HTML and immediately evaluates CSS media queries. The ${clientLabel} layout is visible — no JS needed. This is why the CSS approach avoids layout shift entirely.`;
      if (strategy === "useCurrentBreakpoint")
        return "The browser paints the skeleton. There's nothing to be wrong about — a loading state is a loading state. The user knows content is coming.";
      if (strategy === "naiveWindowCheck")
        return mismatch
          ? `⚠️ The browser paints the server's ${serverLabel} layout. The user is on ${clientLabel} — this is wrong, and it's about to get worse at hydration.`
          : `The browser paints the server's ${serverLabel} guess. It happens to be right — but the real danger with this approach is what happens next at hydration.`;
      return mismatch
        ? `⚠️ The browser paints the server's ${serverLabel} layout, but the user is on a ${clientLabel} device. This is wrong — but JS hasn't loaded yet, so there's nothing to fix it. The user is stuck looking at this.`
        : `The browser paints the server's ${serverLabel} layout — which happens to match this ${clientLabel} device. No visible problem, but only because the guess was right. Change the client viewport and this breaks.`;

    case "JS Loads":
      return "The JavaScript bundle downloads and parses. Until this finishes, the page looks interactive but isn't — buttons don't work, and React hasn't attached any event handlers yet.";

    case "Hydration":
      if (strategy === "css")
        return "✅ React hydrates — it walks the existing DOM and attaches event handlers. Both layouts are in the markup already, so there's nothing to reconcile. CSS handles which one is visible.";
      if (strategy === "useCurrentBreakpoint")
        return "React hydrates against the skeleton. The server and client agree on the same placeholder, so there's no mismatch. React can safely attach without reconciliation issues.";
      if (strategy === "naiveWindowCheck")
        return mismatch
          ? `🚨 Hydration error. React's first client render calls window.innerWidth, gets ${clientLabel}, and produces different HTML than the server's ${serverLabel} output. React can't cleanly attach — it has to discard the server HTML and re-render from scratch. You'll see a warning in the console.`
          : `React hydrates. The client checks window.innerWidth and gets ${clientLabel} — which matches the server's guess. No error this time, but this code is a ticking bomb. Any viewport that doesn't match the server default will trigger a hydration error.`;
      return `React hydrates — its first client render must produce the same output as the server, or you get a hydration error. So even though React is now running, it still renders the server's "${serverLabel}" guess. It has to.`;

    case "useEffect":
      if (strategy === "css")
        return "✅ Effects run, but there's nothing to correct. The right layout has been visible since the browser first painted. No shift, no flash, no wasted render.";
      if (strategy === "useCurrentBreakpoint")
        return mismatch
          ? `The skeleton resolves to the real ${clientLabel} layout. This is a clean transition — users already expected content to load in. No flash, no jank, just a placeholder doing its job.`
          : `✅ The skeleton resolves to ${clientLabel}. Even though the guess would've been right here, the skeleton pattern means this works the same way regardless of viewport — predictable behavior beats lucky guesses.`;
      if (strategy === "naiveWindowCheck")
        return mismatch
          ? "Effects run, but the damage is already done — React had to tear down the server HTML at hydration. The layout is correct now, but the user may have seen a flash of the full re-render."
          : "Effects run. Everything looks fine — but only because the viewport matched. This pattern silently produces hydration errors for any user whose viewport differs from the server default.";
      return mismatch
        ? `💥 Layout shift. useEffect reads the real viewport (${clientLabel}) and re-renders — the page snaps from ${serverLabel} to ${clientLabel}. The user sees a flash of wrong content. This is Type B: not a React error, but real visual jank.`
        : `✅ useEffect reads the viewport and it matches the guess. No visible shift this time — but this only worked because the server happened to guess "${clientLabel}." Flip the server assumption and you'll see the jank.`;

    case "Interactive":
      if (strategy === "css")
        return "✅ The page is fully interactive. The CSS media query approach never needed JS to show the right layout — it was correct from first paint. No hydration issues, no layout shift, no flash.";
      if (strategy === "useCurrentBreakpoint")
        return "The page is interactive. The skeleton-to-content transition was intentional and clean. This pattern trades a brief loading state for guaranteed consistency — no guessing, no jank, same behavior on every device.";
      if (strategy === "naiveWindowCheck")
        return mismatch
          ? "The page is interactive, but React had to throw away the server-rendered DOM and re-render from scratch. That's slower than no SSR at all — you paid for server rendering and then discarded it."
          : "The page is interactive. No visible issue — but ship this to production and users on different viewports will hit hydration errors. This is the most common SSR bug we see.";
      return mismatch
        ? `The page works now, but the user already saw the layout jump from ${serverLabel} to ${clientLabel}. On slow connections that flash lasts longer. This is the core tradeoff of JS-based responsive rendering — you're racing against the network.`
        : `The page is interactive and everything looks fine — but only because the guess was correct. This approach is fragile: it works when server and client agree, and breaks visibly when they don't. Try toggling the server assumption to see.`;
  }
}

// ─── Mismatch classification ───

function getMismatchInfo(
  strategy: Strategy,
  serverMobile: boolean,
  clientMobile: boolean,
): { label: string; className: string } {
  const mismatch = serverMobile !== clientMobile;

  if (strategy === "css") {
    return { label: "✅ No mismatch", className: styles.mismatchNone };
  }
  if (strategy === "useCurrentBreakpoint") {
    return { label: "✅ No mismatch", className: styles.mismatchNone };
  }
  if (strategy === "naiveWindowCheck") {
    if (!mismatch) {
      return {
        label: "⚠️ No error (lucky guess)",
        className: styles.mismatchTypeB,
      };
    }
    return {
      label: "🚨 Type A — hydration error",
      className: styles.mismatchTypeA,
    };
  }
  // useIsMobile
  if (!mismatch) {
    return {
      label: "⚠️ No mismatch (lucky guess)",
      className: styles.mismatchTypeB,
    };
  }
  return {
    label: "⚠️ Type B — visual jank",
    className: styles.mismatchTypeB,
  };
}

// ─── Main component ───

export default function DemoPage() {
  const [serverMobile, setServerMobile] = useState(true);
  const [clientMobile, setClientMobile] = useState(false);
  const [strategy, setStrategy] = useState<Strategy>("useIsMobile");

  // Timeline state — click to jump to a phase
  const [activePhaseIndex, setActivePhaseIndex] = useState(-1);
  const [shouldFlash, setShouldFlash] = useState(false);

  const currentPhase: Phase | null =
    activePhaseIndex >= 0 ? PHASES[activePhaseIndex] : null;
  const serverPhase: Phase | null = activePhaseIndex >= 0 ? currentPhase : null;

  useEffect(() => {
    const mismatch = serverMobile !== clientMobile;

    const isFlashPhase =
      // useIsMobile: jank starts at useEffect and persists
      (strategy === "useIsMobile" &&
        currentPhase != null &&
        PHASES.indexOf(currentPhase) >= PHASES.indexOf("useEffect")) ||
      // naiveWindowCheck: error starts at Hydration and persists
      (strategy === "naiveWindowCheck" &&
        currentPhase != null &&
        PHASES.indexOf(currentPhase) >= PHASES.indexOf("Hydration"));

    setShouldFlash(mismatch && isFlashPhase);
  }, [currentPhase, strategy, serverMobile, clientMobile]);

  function selectPhase(index: number) {
    // Click the active phase again to deselect (back to "not started")
    setActivePhaseIndex(index === activePhaseIndex ? -1 : index);
  }

  const mismatchInfo = getMismatchInfo(strategy, serverMobile, clientMobile);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>SSR Hydration Visualizer</h1>

      {/* ─── Controls ─── */}
      <div className={styles.controls}>
        <div
          className={
            strategy === "css"
              ? styles.controlGroupDisabled
              : styles.controlGroup
          }
        >
          <span className={styles.controlLabel}>
            {strategy === "css" ? "Server assumes (n/a)" : "Server assumes"}
          </span>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              disabled={strategy === "css"}
              className={
                serverMobile
                  ? styles.segmentedButtonActive
                  : styles.segmentedButton
              }
              onClick={() => setServerMobile(true)}
            >
              Mobile
            </button>
            <button
              type="button"
              disabled={strategy === "css"}
              className={
                !serverMobile
                  ? styles.segmentedButtonActive
                  : styles.segmentedButton
              }
              onClick={() => setServerMobile(false)}
            >
              Desktop
            </button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Client is actually</span>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              className={
                clientMobile
                  ? styles.segmentedButtonActive
                  : styles.segmentedButton
              }
              onClick={() => setClientMobile(true)}
            >
              Mobile
            </button>
            <button
              type="button"
              className={
                !clientMobile
                  ? styles.segmentedButtonActive
                  : styles.segmentedButton
              }
              onClick={() => setClientMobile(false)}
            >
              Desktop
            </button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Responsive pattern</span>
          <div className={styles.segmentedControl}>
            {(
              [
                ["naiveWindowCheck", "window.innerWidth"],
                ["useIsMobile", "useIsMobile"],
                ["useCurrentBreakpoint", "useCurrentBreakpoint"],
                ["css", "CSS Media Queries"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  strategy === value
                    ? styles.segmentedButtonActive
                    : styles.segmentedButton
                }
                onClick={() => setStrategy(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.mismatchIndicator}>
          <span className={styles.mismatchLabel}>Hydration mismatch?</span>
          <span className={mismatchInfo.className}>{mismatchInfo.label}</span>
        </div>

        <div className={styles.controlGroupFull}>
          <span className={styles.controlLabel}>Lifecycle phase</span>
          <div className={styles.segmentedControlStretch}>
            {PHASES.map((phase, i) => (
              <button
                key={phase}
                type="button"
                className={
                  i === activePhaseIndex
                    ? styles.segmentedButtonActive
                    : styles.segmentedButton
                }
                onClick={() => selectPhase(i)}
              >
                {phase}
              </button>
            ))}
          </div>
          <div className={styles.annotation}>
            {getAnnotation(strategy, serverMobile, clientMobile, currentPhase)}
          </div>
        </div>
      </div>

      {/* ─── Split panels ─── */}
      <div className={styles.panels}>
        {/* Server panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Server</span>
            <span className={styles.panelPhase}>
              {serverPhase ?? "not started"}
            </span>
          </div>
          <div className={styles.panelBody}>
            {getServerContent(strategy, serverMobile, serverPhase)}
          </div>
        </div>

        {/* Client panel */}
        <div className={shouldFlash ? styles.panelFlash : styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Client / Browser</span>
            <span className={styles.panelPhase}>
              {currentPhase ?? "not started"}
            </span>
          </div>
          <div className={styles.panelBody}>
            {getClientContent(
              strategy,
              serverMobile,
              clientMobile,
              currentPhase,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
