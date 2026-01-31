# Plan: Generalizing Deep Audio Logs to Community Intel

## 1. Objective
Transform the specific "Deep Audio Log" feature into a generalized "Community Intel" section. This will aggregate and display insights from both **Video Transcripts** (Audio) and **Reddit Threads** (Text) with appropriate distinction.

## 2. Requirements
- **Unified UI**: A single section displaying cards for both source types.
- **Iconography**:
    - Videos: Speaker/Mic Icon 🔊
    - Reddit: Chat/Message Icon 💬
- **Backend Logic**:
    - Update `judge-system` to extract quotes from Reddit sources (previously strictly forbidden).
    - Ensure source discrimination (URL-based or metadata-based).

## 3. Architecture & Task Breakdown

### Phase 2: Implementation

#### 🤖 Backend Specialist
- **File**: `lib/prompts/judge-system.ts`
- **Task**: Update `JUDGE_SYSTEM_INSTRUCTION` and `JUDGE_SCHEMA`.
    - Change prompt to allow "Reddit Threads" in `audioInsights` (renaming concept to `communityInsights` internally or just expanding definition).
    - enforce `sourceUrl` is present.

#### 🎨 Frontend Specialist
- **File**: `components/analysis-dashboard.tsx`
- **Task**: 
    - Rename UI Header: "DEEP AUDIO LOG" -> "COMMUNITY INTEL".
    - Update Badge: "TRANSCRIPT_DUMP" -> "SOURCE_DUMP".
    - Update Card Rendering:
        - Check `sourceUrl` or `topic`.
        - If `reddit.com`: Show Message Icon, specific styling.
        - If `youtube.com`: Show Speaker Icon (existing styling).
    - Update Sentiment Label: "Audio Sentiment" -> "Source Sentiment".

#### 🧪 Test Engineer / Verification
- **Task**: Manual verification script or walkthrough.
    - search for a popular product (e.g. "RTX 4060").
    - Verify both Reddit and YouTube quotes appear in the grid.
    - Validate click-through links.

## 4. Verification Strategy
- **Security**: Ensure no XSS from quoted text (React handles this, but watch for `dangerouslySetInnerHTML`).
- **Quality**: Ensure Reddit quotes aren't full garbage (prompt tuning).

## 5. Agent Assignment
1. `backend-specialist` -> Update Prompts.
2. `frontend-specialist` -> Update Dashboard UI.
3. `test-engineer` -> Verify output and links.
