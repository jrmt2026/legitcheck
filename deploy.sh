#!/bin/bash
# LegitCheck PH — One-shot deploy script
# Run this from inside the legitcheck-ph folder
# chmod +x deploy.sh && ./deploy.sh

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}"
echo "  _                _ _    ____ _               _    ____  _   _"
echo " | |    ___  __ _(_) |_ / ___| |__   ___  ___| | _|  _ \| | | |"
echo " | |   / _ \/ _\` | | __| |   | '_ \ / _ \/ __| |/ / |_) | |_| |"
echo " | |__|  __/ (_| | | |_| |___| | | |  __/ (__|   <|  __/|  _  |"
echo " |_____\___|\__, |_|\__|\____|_| |_|\___|\___|_|\_\_|   |_| |_|"
echo "            |___/                                                "
echo -e "${NC}"
echo -e "${GREEN}Check muna bago bayad.${NC}"
echo ""

# ── Step 1: Check prerequisites ────────────────────────────────────────
echo -e "${YELLOW}Step 1/6: Checking prerequisites...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js not found. Install from nodejs.org${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm not found.${NC}"; exit 1; }
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then echo -e "${RED}Node 18+ required. Current: $(node -v)${NC}"; exit 1; fi
echo -e "${GREEN}✓ Node $(node -v), npm $(npm -v)${NC}"

# ── Step 2: Install dependencies ───────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 2/6: Installing dependencies...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ── Step 3: Environment setup ──────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 3/6: Environment setup...${NC}"
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}No .env.local found. Let's set it up now.${NC}"
  echo ""
  echo -e "${BLUE}You need:${NC}"
  echo "  1. Supabase project → supabase.com (free)"
  echo "  2. Anthropic API key → console.anthropic.com"
  echo ""
  read -p "Supabase Project URL (https://xxx.supabase.co): " SUPA_URL
  read -p "Supabase Anon Key: " SUPA_ANON
  read -p "Supabase Service Role Key: " SUPA_SERVICE
  read -p "Anthropic API Key (sk-ant-...): " ANTHROPIC_KEY

  cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPA_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPA_ANON}
SUPABASE_SERVICE_ROLE_KEY=${SUPA_SERVICE}
ANTHROPIC_API_KEY=${ANTHROPIC_KEY}
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
  echo -e "${GREEN}✓ .env.local created${NC}"
else
  echo -e "${GREEN}✓ .env.local found${NC}"
fi

# ── Step 4: Database setup reminder ───────────────────────────────────
echo ""
echo -e "${YELLOW}Step 4/6: Database setup...${NC}"
echo -e "${BLUE}Have you run the SQL migrations in Supabase yet?${NC}"
echo "  Files: supabase/migrations/001_initial_schema.sql"
echo "         supabase/migrations/002_share_links.sql"
echo ""
read -p "Run migrations now? (y/n): " RUN_MIGRATIONS
if [ "$RUN_MIGRATIONS" = "y" ]; then
  if command -v supabase >/dev/null 2>&1; then
    echo "Running via Supabase CLI..."
    supabase db push
  else
    echo -e "${YELLOW}Supabase CLI not found. Please paste the SQL files manually:${NC}"
    echo "  1. Go to your Supabase project → SQL Editor"
    echo "  2. Paste contents of: supabase/migrations/001_initial_schema.sql"
    echo "  3. Run it, then paste: supabase/migrations/002_share_links.sql"
    read -p "Press Enter when done..."
  fi
fi

# ── Step 5: Build ─────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 5/6: Building...${NC}"
npm run build
echo -e "${GREEN}✓ Build successful${NC}"

# ── Step 6: Deploy or Run ─────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 6/6: Deploy options${NC}"
echo ""
echo "  1. Run locally (http://localhost:3000)"
echo "  2. Deploy to Vercel (production)"
echo "  3. Build only (already done)"
echo ""
read -p "Choose (1/2/3): " DEPLOY_CHOICE

if [ "$DEPLOY_CHOICE" = "1" ]; then
  echo -e "${GREEN}Starting local server...${NC}"
  npm run start

elif [ "$DEPLOY_CHOICE" = "2" ]; then
  if ! command -v vercel >/dev/null 2>&1; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
  fi
  echo -e "${YELLOW}Deploying to Vercel...${NC}"
  echo ""
  echo -e "${BLUE}You'll be asked to log in to Vercel if not already.${NC}"
  echo -e "${BLUE}When asked about environment variables, add these:${NC}"
  echo "  NEXT_PUBLIC_SUPABASE_URL"
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "  SUPABASE_SERVICE_ROLE_KEY"
  echo "  ANTHROPIC_API_KEY"
  echo "  NEXT_PUBLIC_APP_URL (set to your vercel domain after deploy)"
  echo ""
  vercel --prod
  echo ""
  echo -e "${GREEN}✓ Deployed! After deploy:${NC}"
  echo "  1. Copy your Vercel URL (e.g. legitcheck-ph.vercel.app)"
  echo "  2. Update NEXT_PUBLIC_APP_URL in Vercel dashboard"
  echo "  3. Add your Vercel URL to Supabase → Auth → URL Configuration → Redirect URLs"
  echo "  4. Update Site URL in Supabase → Auth → URL Configuration"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  LegitCheck PH is ready. Check muna bago bayad.${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
