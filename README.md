# OF Chatbot - AI-Powered Conversation Agent

An AI-powered chatbot for OnlyFans managers that automates fan conversations, builds relationships, and naturally sells PPV content.

## Features

- **Natural Conversations**: Uses Deepseek LLM to respond like a real person
- **4-Phase Relationship System**: Introduction → Flirting → Heating Up → Close
- **Smart Engagement Scoring**: Multi-factor scoring tracks fan interest
- **PPV Sales Integration**: Natural PPV offers without appearing salesy
- **Objection Handling**: Price objections get 15% discount (once per fan per PPV)
- **Power Dynamic Detection**: Adapts tone based on fan behavior
- **CTA Library**: 7 types of calls-to-action for varied selling approaches

## Requirements

- Node.js 20+
- Deepseek API key

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your DEEPSEEK_API_KEY

# 3. Initialize database
npm run db:init

# 4. Seed demo data
npm run db:seed

# 5. Run the chatbot
npm run dev
```

## CLI Commands

Once running, use these commands:

| Command | Description |
|---------|-------------|
| `/chat <fan_id>` | Start conversation with existing fan |
| `/chat new <name>` | Create new fan and start conversation |
| `/fans` | List all fans |
| `/ppv` | List available PPV scripts |
| `/profile <fan_id>` | Show fan profile details |
| `/score <fan_id>` | Show engagement score breakdown |
| `/stats` | Show overall statistics |
| `/quit` | Exit application |

## Project Structure

```
src/
├── api/           # Deepseek API client with retry logic
├── chat/          # Conversation engine, scoring, phase management
├── cli/           # Interactive CLI interface
├── db/            # SQLite database setup and migrations
├── fans/          # Fan profile management
├── persona/       # YAML-based persona configuration
└── ppv/           # PPV scripts, CTA library, objection handling
```

## Configuration

### Environment Variables

Create a `.env` file with:

```env
DEEPSEEK_API_KEY=sk-your-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com  # optional
DEEPSEEK_MODEL=deepseek-chat                  # optional
```

### Persona

Edit `config/persona.yaml` to customize:
- Name, age, location
- Personality traits
- Response style (emojis, capitalization, etc.)
- CTA templates
- Discount messaging

## Phase System

| Phase | Name | Description | Score Threshold |
|-------|------|-------------|-----------------|
| 1 | Introduction | Small talk, getting to know each other | 0 |
| 2 | Flirting | Light flirting, building connection | 30 |
| 3 | Heating Up | More intimate, suggesting exclusive content | 50 |
| 4 | Close | Offering PPV scripts naturally | 70 |

## Engagement Scoring

Multi-factor score (0-100):
- **Message count**: +1 per message (max 20)
- **Sexual keywords**: +5-10 per keyword
- **Response time**: +10 if <5 min, +5 if <30 min
- **Purchase history**: +20 per PPV bought (max 40)
- **Sentiment**: +5 positive, +10 very positive, -5 negative

## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Run production build
npm start
```

## Architecture

- **Feature-based modules**: Organized by domain (chat, fans, ppv, etc.)
- **Repository pattern**: Database operations abstracted
- **Service layer**: Business logic separated from data access
- **Singleton instances**: For stateless services

## License

ISC
