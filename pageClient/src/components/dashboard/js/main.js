(() => {
  function initDashboard() {
    window.DashboardAICore?.init();
    window.DashboardUI?.initLanguageSwitcher();
    window.DashboardUI?.initTypingAnimations();
    window.DashboardUI?.initTimelineAnimations();
    window.DashboardUI?.initHudTelemetry();
    window.DashboardUI?.initMouseInteractions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
  } else {
    initDashboard();
  }
})();
