import packagejson from '../package.json'
import axios from 'axios'

function parseSemver(ver) {
  if (!ver) return null
  var groups = ver.match(/^v((([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)$/)
  if (groups && groups.length > 6) {
    var total = Number(groups[3]) * 10000 + Number(groups[4]) * 100 + Number(groups[5])
    if (isNaN(total)) {
      console.warn('Invalid version total', groups[3], groups[4], groups[5])
      return null
    }
    return {
      name: ver,
      total,
      version: groups[2],
      major: Number(groups[3]),
      minor: Number(groups[4]),
      patch: Number(groups[5]),
      preRelease: groups[6] || null
    }
  } else {
    console.warn('Invalid semver string', ver)
  }
  return null
}

function getReleases() {
  return axios
    .get(`https://api.github.com/repos/advplyr/audiobookshelf/releases`)
    .then((res) => {
      return res.data
        .map((release) => {
          const tagName = release.tag_name
          const verObj = parseSemver(tagName)
          if (verObj) {
            verObj.pubdate = new Date(release.published_at)
            verObj.changelog = release.body
            return verObj
          }
          return null
        })
        .filter((verObj) => verObj)
    })
    .catch((error) => {
      console.error('Failed to get releases', error)
      return []
    })
}

export const currentVersion = packagejson.version

export async function checkForUpdate() {
  if (!packagejson.version) {
    return null
  }

  const releases = await getReleases()

  // Inject Custom Alpha/Beta Release
  const isCustomBuild = packagejson.version.match(/[a-e]$/)
  if (isCustomBuild) {
    releases.unshift({
      name: `v${packagejson.version} (Custom Build)`,
      total: 999999, // Ensure it is always at the top
      version: packagejson.version,
      major: 2,
      minor: 33,
      patch: 0,
      preRelease: 'custom',
      pubdate: new Date(),
      changelog: `### Custom Build (v${packagejson.version})\n- **Feature:** Fixed Database Migration issue where \`podcastFilenameFormat\` was missing (PR #4331 fix).\n- **Feature:** Added **Continue Series** shelf for Podcasts (PR #4978).\n- **Feature:** Custom Podcast Filename Templates (PR #4331).\n- **Feature:** Added **MusicBrainz** as a Metadata and Cover Provider (PR #4748).\n- **Feature:** Added **Podcast Release Calendar** page (PR #4409).\n- **Feature:** Added **"Play Next"** button to book cards and podcast episodes (PR #2464).\n- **Feature:** Sync Audiobook to E-book - "Open Current Chapter" button in player (PR #3334).\n- **Feature:** Robust Metadata ID Matching - stores ABS IDs in \`metadata.json\` to prevent data loss when moving files (PR #4857).\n- **Feature:** Added Support for reading embedded "tags" metadata from audio files (PR #4681).\n- **Feature:** Metadata Embedding for Podcasts - write changes back to podcast audio files (PR #4594).\n- **Feature:** Added **Auto Tag** button to audiobook Edit -> Details tab.\n- **Feature:** Keyword-based auto-tagging engine for generating smart genres/tags.\n- **Feature:** Folder structure scanner now reads **Genre** from 4th-level directories (\`Genre/Author/Series/Title\`).\n- **Feature:** Support for uploading files to existing library item folders (PR #5045).\n- **Feature:** Added "Started" filter to Series page (PR #4938).\n- **Feature:** Interactive sorting for the Narrators page (PR #4828).\n- **Feature:** Quick-buttons to move items to top/bottom of playlists (PR #4907).\n- **Feature:** Hide and Unhide specific series from the library shelves (PR #4807).\n- **Feature:** Rename existing Series directly from the UI with duplicate validation (PR #4962).\n- **Feature:** Per-book playback speed persistence (PR #5104).\n- **Feature:** Added auto-skip for chapter intros and outros during playback (PR #5092).\n- **Feature:** Added "Natural volume scaling" option for logarithmic volume slider control (PR #4935).\n- **Optimization:** Enabled HTTP Response Compression (Gzip) for faster remote access (PR #4774).\n- **Optimization:** Precise Log Timestamps including ms for better debugging (PR #5056).\n- **Optimization:** Increased metadata search timeout to 120s for better reliability (PR #4788).\n- **Optimization:** Embedded metadata in MP4/M4B files now strictly conforms to Mp3tag/Plex standards for broader ecosystem compatibility (PR #4959).\n- **Optimization:** Improved API cache management (PR #5073).\n- **Optimization:** Extracted and cached comic pages on the server (PR #5078).\n- **Optimization:** Improved built-in cover extractor to pick the highest resolution image and ignore placeholders (PR #4988).\n- **Security:** Token Refresh Grace Period - fixes "Session Expired" race conditions on mobile/watch (PR #5004).\n- **Security:** Configurable Bcrypt hashing cost (defaulted to 12) for stronger password security (PR #5084).\n- **Security:** Patched IDOR vulnerabilities allowing unauthorized manipulation of bookmarks, media progress, and listening sessions (PR #5063).\n- **UX:** Added comprehensive 1-5 star rating & review system (PR #5046).\n- **UX:** Added total duration & progress stats to Series pages (PR #5064).\n- **UX:** Adjustable Cover Preview sizing when searching for covers (PR #5065).\n- **UX:** Added proper autocomplete HTML attributes for Password Managers (PR #5089).\n- **UX:** Improved download icon visibility on public Share pages when covers are light-colored (PR #4970).\n- **UX:** Smarter notification (toast) placement to avoid overlapping with media player (PR #4782).\n- **Fix:** Improved log purging logic for daily and scanner logs (PR #5015).\n- **Fix:** OS-level MediaSession chapter boundaries (PR #5080).\n- **Fix:** Subtitle parsing bug when titles contain colons (PR #5036).\n- **Fix:** "Quick Match" chapter merging bug where old chapters remained if new list was shorter (PR #5006).\n- **Fix:** Automatically update Author Name in database if matching to a corrected name (PR #5076).\n- **Fix:** Case-insensitive lookup for series and authors during import to prevent duplicates (PR #4976).\n- **Fix:** Database crash (UniqueConstraintError) during scan caused by author/series name casing (Internal Fix).`
    })
  }

  if (!releases.length) {
    console.error('No releases found')
    return null
  }

  const currentVersion = releases.find((release) => release.version == packagejson.version)
  if (!currentVersion) {
    console.error('Current version not found in releases')
    return null
  }

  const latestVersion = releases[0]
  // Show all releases with the same major version and minor version 32 or 33
  const releasesToShow = releases.filter((release) => {
    if (release.version === packagejson.version) return true
    return release.major == 2 && (release.minor == 32 || release.minor == 33)
  })

  return {
    hasUpdate: latestVersion.total > currentVersion.total,
    latestVersion: latestVersion.version,
    githubTagUrl: `https://github.com/advplyr/audiobookshelf/releases/tag/v${latestVersion.version}`,
    currentVersion: currentVersion.version,
    releasesToShow
  }
}
