(() => {
  const site = 'https://zengyuxiang7.goatcounter.com';
  const storageKey = 'homepage-last-visit-day';
  const dayFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
  });

  async function displayTotal() {
    try {
      const response = await fetch(`${site}/counter/TOTAL.json`, { credentials: 'omit' });
      if (!response.ok) throw new Error(`Counter returned HTTP ${response.status}`);
      const data = await response.json();
      if (typeof data.count !== 'string' || !/^[\d\s,. ]+$/.test(data.count)) {
        throw new Error('Counter returned an invalid total');
      }
      document.getElementById('visit-count').textContent = data.count;
      document.getElementById('visit-counter').hidden = false;
    } catch (error) {
      // Keep an unavailable total hidden instead of showing a fabricated number.
      console.warn('Unable to display the visitor total:', error);
    }
  }

  void displayTotal();
  // Local previews never contribute to the published site's statistics.
  if (location.hostname !== 'zengyuxiang7.github.io' || navigator.webdriver) return;

  window.goatcounter = { no_onload: true, no_events: true, endpoint: `${site}/count` };
  const tracker = document.createElement('script');
  tracker.src = 'https://gc.zgo.at/count.js';
  tracker.async = true;

  function recordDay() {
    const counter = window.goatcounter;
    if (document.visibilityState !== 'visible' || counter.filter()) return;
    const today = dayFormat.format(new Date());
    if (localStorage.getItem(storageKey) === today) return;
    // Reserve the day before sending, so reloads cannot repeat a pending request.
    // A blocked/lost request can undercount; we never retry it within the same day.
    localStorage.setItem(storageKey, today);
    // Override GoatCounter's 8-hour session window: midnight starts a new day.
    counter.count({ path: '/', title: 'Yuxiang Zeng', no_session: true });
  }

  async function recordVisit() {
    try {
      if (navigator.locks) {
        // Serialize simultaneous tabs sharing this origin and browser storage.
        await navigator.locks.request(storageKey, recordDay);
      } else {
        recordDay();
      }
    } catch (error) {
      // Without persistent storage, skip recording rather than count every reload.
      console.warn('Unable to record a daily visit:', error);
    }
  }

  tracker.addEventListener('load', () => {
    void recordVisit();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void recordVisit();
    });
  });
  tracker.addEventListener('error', () => console.warn('Visitor tracking script could not load.'));
  document.head.appendChild(tracker);
})();
