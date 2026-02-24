# EPIC: OF Chatbot - AI-Powered OnlyFans Conversation Agent

> **Type**: `epic` | **Status**: `spec-locked` | **Clarity**: 95/100

---

## 1. Goal (WHY + Expected Behavior)

**Problem**: OnlyFans managers spend 6-10 hours daily manually chatting with fans, building relationships, and selling PPV content. This is time-consuming, inconsistent, and doesn't scale.

**Solution**: An AI-powered chatbot that:
- Converses naturally like a real person (not a bot)
- Progresses through 4 relationship phases (Introduction → Flirting → Heating up → Close)
- Detects optimal moments to offer PPV content
- Handles objections intelligently (price → discount, other → graceful fallback)
- Maintains fan profiles with preferences, purchase history, and engagement scores

**Expected Behavior**: A CLI tool where user can start a conversation with any fan, and the bot maintains natural, engaging dialogue that naturally leads to PPV sales without appearing salesy.

---

## 2. Non-Goals / Out of Scope

### NOT in MVP:
- ❌ OnlyFans API integration (local simulation only)
- ❌ Inside jokes system (future phase)
- ❌ Whale detection/flagging
- ❌ Content tier system (Tier 1-4)
- ❌ Web UI / Desktop app
- ❌ Multi-persona switching at runtime
- ❌ Media file handling (photos/videos)
- ❌ GF Experience mode (explicitly avoided per domain guidelines)

### Future Phases:
- OnlyFans API integration
- Inside jokes with persistence
- Whale detection and premium pricing
- Content tier progression system
- Web dashboard

---

## 3. Background / Current State

**Current State**: Empty project (git init only)

**Domain Knowledge Sources**:
- `podsumowanie.md` — 20 training transcripts on OF chatting strategies
- Established patterns: story-based sexting, 4-phase transitions, CTA frameworks, objection handling

**Key Domain Insights Applied**:
1. **First 5 messages rule** — most conversations die early; bot must be engaging from start
2. **Story-based sexting** — narratives about "what we'd do together", not dry statements
3. **Natural PPV embedding** — never ask permission, sneak up on the sale
4. **Power dynamics** — detect sub/dom and adapt tone accordingly
5. **Aftercare** — continue conversation post-sale, don't disappear

---

## 4. Requirements

### 4.1 Functional Requirements

#### FR-001: Conversation Engine
- Bot responds in character based on persona YAML config
- Uses Deepseek API (deepseek-chat model)
- Maintains sliding window context (last 20 messages + summary)
- Implements story-based responses (detailed narratives, not short replies)
- Adapts tone based on detected power dynamic (sub/dom/neutral)

#### FR-002: Phase System
- **Phase 1 (Introduction)**: Small talk, getting to know each other
- **Phase 2 (Flirting)**: Light flirting, building connection
- **Phase 3 (Heating up)**: More intimate, suggesting exclusive content
- **Phase 4 (Close)**: Offering PPV scripts naturally

**Transition Triggers**:
- Automatic: min 5 messages in phase + engagement score ≥ threshold
- Manual: fan writes something explicitly sexual → skip to higher phase
- Bot suggests transition but never forces

#### FR-003: Scoring System
Multi-factor engagement score (0-100):
- Conversation length (+1 per message)
- Sexual keywords detected (+5-10 per keyword)
- Response time (< 5 min = +10, < 30 min = +5)
- Purchase history (+20 per PPV bought)
- Sentiment analysis (positive = +5, very positive = +10)

**Phase Thresholds**:
- Phase 1 → 2: score ≥ 30
- Phase 2 → 3: score ≥ 50
- Phase 3 → 4: score ≥ 70

#### FR-004: PPV Management
- Predefined PPV scripts stored in SQLite
- Each PPV: id, title, content_text, price, category, tags, preview_text, times_used
- Natural PPV embedding in conversation (NOT "Would you like to buy?")
- CTA library with 7 types:
  1. Video-implication questions
  2. If You Were Here questions
  3. Follow-up upselling
  4. Gamification/challenges
  5. FOMO triggers
  6. Dominant tone CTAs
  7. Soft/no-pressure CTAs

#### FR-005: Objection Handling
- **Price objection detected** → offer 15% discount (once per fan per PPV)
- **Other objection** → "No worries babe 😘" + continue normal conversation (not sexting)
- LLM classifies objection type: `price_objection` | `not_interested` | `maybe_later` | `other`

#### FR-006: Fan Profile Management
Stored per fan:
- `fan_id` (UUID)
- `name` / `nickname`
- `conversation_history` (JSON)
- `purchased_ppv_ids` (array)
- `current_phase` (1-4)
- `engagement_score` (0-100)
- `power_dynamic` (sub/dom/neutral)
- `preferences` (detected from conversation)
- `discounts_offered` (array of PPV IDs)
- `notes` (manual user notes)
- `created_at`, `updated_at`

#### FR-007: CLI Interface
Commands:
```
/chat <fan_id>    - Start/continue conversation with fan
/fans             - List all fans with summary
/ppv              - List available PPV scripts
/ppv add          - Interactively add new PPV
/profile <fan_id> - Show fan profile details
/score <fan_id>   - Show engagement score breakdown
/export <fan_id>  - Export conversation to JSON
/quit             - Exit application
```

### 4.2 Non-Functional Requirements

#### NFR-001: Performance
- API response time: < 5 seconds per message
- Local operations: < 100ms

#### NFR-002: Reliability
- Retry logic: 3 attempts with exponential backoff
- Graceful degradation: show error message if API fails after retries
- No data loss: all conversations persisted before showing to user

#### NFR-003: Security
- API key stored in `.env` (never committed)
- `.env` in `.gitignore`
- No hardcoded secrets

#### NFR-004: Usability
- Clear CLI prompts
- Colored output for readability
- Error messages explain what went wrong

---

## 5. Data Impact

### 5.1 Database Schema (SQLite)

```sql
-- Fans table
CREATE TABLE fans (
  id TEXT PRIMARY KEY,
  name TEXT,
  nickname TEXT,
  current_phase INTEGER DEFAULT 1,
  engagement_score INTEGER DEFAULT 0,
  power_dynamic TEXT DEFAULT 'neutral',
  preferences TEXT, -- JSON
  discounts_offered TEXT, -- JSON array
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Conversations table
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  fan_id TEXT REFERENCES fans(id),
  role TEXT, -- 'fan' or 'bot'
  content TEXT,
  phase INTEGER,
  score_at_message INTEGER,
  created_at TEXT
);

-- PPV Scripts table
CREATE TABLE ppv_scripts (
  id TEXT PRIMARY KEY,
  title TEXT,
  content_text TEXT,
  price INTEGER, -- in cents to avoid floating point
  category TEXT,
  tags TEXT, -- JSON array
  preview_text TEXT,
  cta_type TEXT,
  times_used INTEGER DEFAULT 0,
  created_at TEXT
);

-- Purchases table
CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  fan_id TEXT REFERENCES fans(id),
  ppv_id TEXT REFERENCES ppv_scripts(id),
  price_paid INTEGER,
  discount_applied INTEGER DEFAULT 0,
  created_at TEXT
);

-- Persona config stored as YAML file, not in DB
```

### 5.2 File Structure

```
chatting-bot/
├── src/
│   ├── chat/
│   │   ├── conversation-engine.ts
│   │   ├── phase-manager.ts
│   │   ├── context-builder.ts
│   │   └── scoring-system.ts
│   ├── fans/
│   │   ├── fan-service.ts
│   │   ├── fan-repository.ts
│   │   └── fan-types.ts
│   ├── ppv/
│   │   ├── ppv-service.ts
│   │   ├── ppv-repository.ts
│   │   ├── cta-library.ts
│   │   └── objection-handler.ts
│   ├── persona/
│   │   ├── persona-loader.ts
│   │   └── persona-types.ts
│   ├── db/
│   │   ├── database.ts
│   │   ├── migrations.ts
│   │   └── seed.ts
│   ├── api/
│   │   ├── deepseek-client.ts
│   │   └── retry-handler.ts
│   ├── cli/
│   │   ├── cli.ts
│   │   ├── commands.ts
│   │   └── formatters.ts
│   └── index.ts
├── config/
│   └── persona.yaml
├── data/
│   └── chatbot.db (SQLite, gitignored)
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 6. Approach

### 6.1 Architecture Pattern
- **Feature-based modules** (chat/, fans/, ppv/, persona/, db/, api/, cli/)
- **Repository pattern** for data access
- **Service layer** for business logic
- **Dependency injection** for testability

### 6.2 Key Design Decisions

1. **Context Management**: Sliding window (last 20 messages) + LLM-generated summary of older messages
2. **Phase Transitions**: Hybrid — automatic based on score, but can be accelerated by fan behavior
3. **PPV Offering**: LLM decides WHEN and HOW based on conversation context + phase + score
4. **Objection Classification**: LLM classifies, code handles response logic
5. **Persona**: YAML file loaded at startup, included in system prompt

### 6.3 Failure Modes & Mitigations

| Failure Mode | Mitigation |
|--------------|------------|
| Deepseek API down | 3 retries with exponential backoff, graceful error message |
| Rate limited | Track requests, implement queuing if needed |
| LLM generates out-of-character | Strong system prompt with persona, examples, and constraints |
| Context too long | Sliding window + summarization |
| SQLite corruption | Regular backups, WAL mode |

---

## 7. Execution / Runbook

### 7.1 Setup Steps
```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env: DEEPSEEK_API_KEY=sk-...

# 3. Initialize database
npm run db:init

# 4. Seed demo data
npm run db:seed

# 5. Run
npm run dev
```

### 7.2 First Conversation Flow
```
> /chat new
Enter fan name: Tom

[Phase 1: Introduction]
Bot: heyy Tom! 🥰 omg I've been scrolling Netflix for like an hour and I swear I've seen everything...
      what are you up to? I need distraction from my indecisiveness haha

Fan: haha I'm just watching some basketball

Bot: basketball!! okay so are you a player or just a watcher?
      I actually played a long time ago but I literally dislocated my knee during a game
      so that was the end of my WNBA dreams 😭

Fan: oh no that sucks! Yeah I play sometimes

[Score: 35 → Phase 2 triggered]

[Phase 2: Flirting]
Bot: a player!! I knew it 🏀
      so what position do you play? let me guess... you seem like a point guard
      or am I totally off? 😏
...
```

---

## 8. Acceptance Criteria

### MVP Must Pass ALL:

- [ ] **AC-001**: CLI starts without errors (`npm run dev`)
- [ ] **AC-002**: Can create new fan and start conversation (`/chat new`)
- [ ] **AC-003**: Bot responds in character (matches persona.yaml tone)
- [ ] **AC-004**: Bot uses story-based responses (detailed, not short)
- [ ] **AC-005**: Phases transition correctly:
  - [ ] Automatic: score threshold reached
  - [ ] Manual: explicit sexual content detected
- [ ] **AC-006**: PPV is offered naturally in Phase 3-4 (NOT salesy)
- [ ] **AC-007**: CTA is included with PPV offer
- [ ] **AC-008**: Price objection → 15% discount offered (once)
- [ ] **AC-009**: Other objection → graceful fallback, continue conversation
- [ ] **AC-010**: Conversation history persisted to SQLite
- [ ] **AC-011**: Fan profile updated after each session
- [ ] **AC-012**: Can resume conversation with existing fan (`/chat <fan_id>`)
- [ ] **AC-013**: Can list fans (`/fans`)
- [ ] **AC-014**: Can view fan profile (`/profile <fan_id>`)
- [ ] **AC-015**: Can add new PPV (`/ppv add`)
- [ ] **AC-016**: API key loaded from `.env`, not hardcoded
- [ ] **AC-017**: API failures handled gracefully (retry + error message)
- [ ] **AC-018**: `.env` is in `.gitignore`

### Negative Tests:
- [ ] **AC-N01**: Bot does NOT ask "Can I show you something?" before PPV
- [ ] **AC-N02**: Bot does NOT change tone when fan doesn't buy
- [ ] **AC-N03**: Bot does NOT offer GF Experience
- [ ] **AC-N04**: Bot does NOT offer discount twice for same PPV to same fan

---

## 9. QA Plan

### 9.1 Manual Testing Scenarios

#### Scenario 1: Happy Path to Sale
```
1. Start new conversation
2. Exchange 10+ messages
3. Verify phase progression (1→2→3→4)
4. Accept PPV offer
5. Verify purchase recorded
6. Verify aftercare (bot continues conversation)
```
**Expected**: Natural flow, PPV offered around message 10-15, purchase recorded

#### Scenario 2: Price Objection
```
1. Start conversation
2. Reach Phase 4
3. When PPV offered, respond "that's too expensive"
4. Verify 15% discount offered
5. Accept discounted price
```
**Expected**: Discount offered once, purchase at 85% price

#### Scenario 3: Not Interested
```
1. Start conversation
2. Reach Phase 4
3. When PPV offered, respond "not really my thing"
4. Verify graceful fallback
5. Verify conversation continues (normal, not sexting)
```
**Expected**: "No worries" response, conversation continues normally

#### Scenario 4: Explicit Fan Accelerates Phase
```
1. Start new conversation (Phase 1)
2. Fan sends explicit sexual message immediately
3. Verify phase jumps to 3 or 4
```
**Expected**: Phase acceleration based on content detection

### 9.2 Automated Tests

```bash
# Unit tests
npm run test

# Coverage target: 80%+
npm run test:coverage
```

Test areas:
- Scoring system calculations
- Phase transition logic
- Objection classification
- Context window management
- Database operations

---

## 10. Rollout / Rollback

### 10.1 Rollout
- Local-only MVP, no production deployment
- Single user (developer) testing

### 10.2 Rollback
- Database: `data/chatbot.db` can be deleted and re-seeded
- Config: `persona.yaml` can be reverted via git
- No external state to roll back

---

## 11. Risks / Unknowns

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Deepseek API changes | Low | High | Abstract API client, can swap providers |
| LLM generates inappropriate content | Medium | High | Strong system prompt, content filtering |
| Context window exceeded | Medium | Medium | Sliding window + summarization |
| SQLite doesn't scale | Low | Low | MVP is single-user, can migrate to Postgres later |
| Bot sounds robotic | Medium | High | Few-shot examples in prompt, persona tuning |

### Open Questions (Resolved):
- ~~Which LLM provider?~~ → Deepseek
- ~~Database?~~ → SQLite
- ~~UI?~~ → CLI
- ~~Phases?~~ → 4-phase system
- ~~Inside jokes in MVP?~~ → No

---

## 12. Definition of Done

**EPIC is DONE when:**

1. ✅ All acceptance criteria (AC-001 through AC-018, AC-N01 through AC-N04) pass
2. ✅ Manual test scenarios 1-4 complete successfully
3. ✅ Unit test coverage ≥ 80%
4. ✅ Code reviewed and approved
5. ✅ README.md documents setup and usage
6. ✅ `.env.example` provided
7. ✅ Demo video showing full conversation flow

---

## 13. Task Breakdown

> Tasks will be created after EPIC approval. Expected structure:

### Phase 1: Foundation
- [ ] **TASK-001**: Project setup (package.json, tsconfig, eslint, prettier)
- [ ] **TASK-002**: SQLite database schema and migrations
- [ ] **TASK-003**: Deepseek API client with retry logic
- [ ] **TASK-004**: Database seed script (persona + 5 PPVs)

### Phase 2: Core Chat
- [ ] **TASK-005**: Persona loader (YAML parsing)
- [ ] **TASK-006**: Context builder (sliding window)
- [ ] **TASK-007**: Conversation engine (LLM integration)
- [ ] **TASK-008**: Scoring system implementation

### Phase 3: Phase Management
- [ ] **TASK-009**: Phase manager (transitions, triggers)
- [ ] **TASK-010**: Power dynamic detection
- [ ] **TASK-011**: Story-based response prompting

### Phase 4: PPV & Sales
- [ ] **TASK-012**: PPV repository and service
- [ ] **TASK-013**: CTA library implementation
- [ ] **TASK-014**: Objection handler (classification + response)
- [ ] **TASK-015**: Discount logic

### Phase 5: Fan Management
- [ ] **TASK-016**: Fan repository and service
- [ ] **TASK-017**: Profile management
- [ ] **TASK-018**: Purchase tracking

### Phase 6: CLI
- [ ] **TASK-019**: CLI framework setup
- [ ] **TASK-020**: All commands implementation
- [ ] **TASK-021**: Formatters and output styling

### Phase 7: Testing & Docs
- [ ] **TASK-022**: Unit tests (80%+ coverage)
- [ ] **TASK-023**: README documentation
- [ ] **TASK-024**: Demo and validation

### Final Gate
- [ ] **TASK-025**: Execution: run end-to-end + post evidence

---

## References

- `podsumowanie.md` — Domain knowledge (OF chatting strategies)
- Deepseek API docs: https://platform.deepseek.com/docs

---

**Labels**: `type:epic`, `area:chatbot`, `priority:high`, `status:spec-locked`
