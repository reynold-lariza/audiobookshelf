# Audiobookshelf Alpha Build (v2.32.1a) Customizations

This file documents the custom modifications made to the local audiobookshelf repository.

## Applied Pull Requests
1. **PR #5073:** Query Performance - Optimizes API cache and Discover query performance. Includes database indexes.
2. **PR #5046:** Rating & Reviews System - Introduces a comprehensive 1-5 star rating and review system for all library items, including an admin moderation page.
3. **PR #5064:** Series Total Duration - Adds the total duration and your total listened time to the top of Series pages, great for tracking long sagas.
4. **PR #5078:** Server-Side Comics - Extracts and caches comic pages on the server instead of the browser, significantly speeding up large comics.
5. **PR #5080:** MediaSession Chapters - Makes the OS-level media scrubber (lock screen) respect chapter boundaries when 'Use chapter track' is enabled.
6. **PR #5006:** Fix Chapter Merging - Fixes a bug where fetching new chapters from Audible doesn't fully overwrite your old chapter list if the new list is shorter.
7. **PR #4988:** Better Cover Extraction - Improves the built-in cover extractor to ignore 1x1 pixel placeholders and always extract the highest resolution cover art embedded in the file.
8. **PR #5036:** Subtitle Parsing Fix - Fixes a bug where titles with a colon (:) were sometimes failing to be correctly split into Title and Subtitle during a scan.
9. **PR #5092:** Auto-Skip Intros/Outros - Adds a feature to automatically skip chapter intros and outros during playback.
10. **PR #5104:** Per-Book Playback Speed - Allows saving and resuming different playback speeds for individual library items instead of a global default.
11. **PR #5089:** Password Manager Support - Adds proper autocomplete HTML attributes to login fields so password managers can easily save and autofill credentials.
12. **PR #5065:** Adjustable Cover Preview Sizing - Adds zoom-in/zoom-out buttons when searching for Cover Art to easily view high-resolution details.
13. **PR #5063:** IDOR Security Fixes - Patches API vulnerabilities preventing unauthorized manipulation of bookmarks, media progress, and listening sessions.
14. **PR #4935:** Natural Volume Scaling - Adds a user setting for logarithmic volume scaling, making the volume slider feel more natural.
15. **PR #4959:** Standardized Embedded Tags - When embedding metadata into MP4/M4B files, Audiobookshelf now strictly conforms to Mp3tag and Plex standards for maximum external compatibility.

## Custom Features Developed

### 1. Folder Structure Genre Extraction
*   **Modified File:** `server/utils/scandir.js`
*   **Description:** Modified `getBookDataFromDir` to extract a 4th-level directory as the `genre`. When scanning a folder structured like `Genre/Author/Series/Title/`, the scanner now successfully applies the Genre.
*   **Modified File:** `server/scanner/LibraryItemScanData.js`
*   **Description:** Updated `setBookMetadataFromFilenames` to apply the parsed genre directly to the book metadata during the scan.

### 2. Auto-Tagging Keyword Engine
*   **New File:** `server/utils/metadata/autoTagger.js`
*   **Description:** Created an intelligent keyword-matching engine. It maps broad categories (e.g., Cybersecurity, Philosophy, Sci-Fi) to arrays of specific keywords. It scans the book's Title, Subtitle, Description, and existing tags/genres using strict regex boundaries and generates relevant tags.
*   **Modified File:** `server/controllers/LibraryItemController.js`
*   **Description:** Added an `autoTag` API endpoint (`POST /api/items/:id/auto-tag`) that utilizes the `autoTagger.js` engine to append the generated tags to the book and save them to the database.
*   **Modified File:** `server/routers/ApiRouter.js`
*   **Description:** Registered the new `/items/:id/auto-tag` route.

### 3. Frontend Auto-Tag Button
*   **Modified File:** `client/components/modals/item/tabs/Details.vue`
*   **Description:** Added an "Auto Tag" button next to "Quick Match" and "Re-Scan" in the Edit -> Details tab. The button triggers the backend `autoTag` endpoint and displays a toast notification upon success.

### 4. Custom Version & Changelog
*   **Modified Files:** `package.json`, `client/package.json`
*   **Description:** Updated version to `2.32.1a`.
*   **Modified File:** `client/plugins/version.js`
*   **Description:** Intercepted the GitHub release check in `checkForUpdate`. Injected a custom alpha release object for `v2.32.1a` containing detailed markdown release notes, ensuring the UI changelog modal renders correctly instead of blank.

## Build and Deployment Details
*   **Docker Image:** The image is built specifically for `linux/amd64` using `docker buildx` to ensure compatibility with the remote VM.
*   **Image Name:** `audiobookshelf:alpha`
*   **Deployment:** Pushed directly to `app@10.0.1.123`.
