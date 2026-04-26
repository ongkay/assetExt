const BADGE_COLOR = "#111827";

let badgeCount = 0;
let hasBadgeCount = false;

export function initializeBadge() {
  chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
  syncBadgeCount(() => updateBadge());
}

export function incrementBadge(done: (count: number) => void) {
  syncBadgeCount(() => {
    badgeCount += 1;
    updateBadge();
    done(badgeCount);
  });
}

export function resetBadge(done: (count: number) => void) {
  syncBadgeCount(() => {
    badgeCount = 0;
    updateBadge();
    done(badgeCount);
  });
}

function syncBadgeCount(done: () => void) {
  if (hasBadgeCount) {
    done();
    return;
  }

  chrome.action.getBadgeText({}, (text) => {
    const parsed = Number.parseInt(text, 10);
    badgeCount = Number.isFinite(parsed) ? parsed : 0;
    hasBadgeCount = true;
    done();
  });
}

function updateBadge() {
  chrome.action.setBadgeText({
    text: badgeCount > 0 ? String(badgeCount) : "",
  });
}
