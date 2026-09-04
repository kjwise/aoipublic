(function () {
  if (window.location.hostname !== "architectsofintent.com") return;

  const GA_ID = "G-H7KWQFR6DD";

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;

  const loadGtag = () => {
    if (document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]')) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(script);
  };

  const schedule = () => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(loadGtag, { timeout: 2000 });
    } else {
      window.setTimeout(loadGtag, 1500);
    }
  };

  window.addEventListener("load", () => {
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    window.gtag("event", "ads_conversion_PAGE_VIEW_1", {});
    schedule();
  });
})();
