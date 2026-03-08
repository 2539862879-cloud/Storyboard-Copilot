import { getVersion } from '@tauri-apps/api/app';

const GITHUB_LATEST_RELEASE_API = 'https://api.github.com/repos/henjicc/Storyboard-Copilot/releases/latest';
const DAILY_CHECK_KEY = 'storyboard:update-check:last-attempt-date';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion?: string;
  currentVersion?: string;
}

interface GithubLatestReleaseResponse {
  tag_name?: string;
}

function getLocalDateKey(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, '');
}

function parseVersionParts(version: string): number[] {
  const core = normalizeVersion(version).split('-')[0] ?? '';
  return core.split('.').map((part) => {
    const parsed = Number.parseInt(part, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  });
}

function compareVersions(left: string, right: string): number {
  const leftParts = parseVersionParts(left);
  const rightParts = parseVersionParts(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue > rightValue) {
      return 1;
    }
    if (leftValue < rightValue) {
      return -1;
    }
  }

  return 0;
}

export async function checkForUpdateOncePerDay(): Promise<UpdateCheckResult> {
  try {
    const todayKey = getLocalDateKey(new Date());
    if (localStorage.getItem(DAILY_CHECK_KEY) === todayKey) {
      return { hasUpdate: false };
    }
    localStorage.setItem(DAILY_CHECK_KEY, todayKey);

    const currentVersion = normalizeVersion(await getVersion());
    if (!currentVersion) {
      return { hasUpdate: false };
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    let latestTag = '';
    try {
      const response = await fetch(GITHUB_LATEST_RELEASE_API, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        return { hasUpdate: false };
      }

      const data = (await response.json()) as GithubLatestReleaseResponse;
      latestTag = normalizeVersion(data.tag_name ?? '');
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (!latestTag) {
      return { hasUpdate: false };
    }

    if (compareVersions(latestTag, currentVersion) > 0) {
      return {
        hasUpdate: true,
        latestVersion: latestTag,
        currentVersion,
      };
    }

    return { hasUpdate: false };
  } catch {
    return { hasUpdate: false };
  }
}
