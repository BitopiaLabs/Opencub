#!/usr/bin/env bash
set -e

echo "Setting up the OpenCub development environment..."

# Install dependencies using pnpm
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build the project
echo "Building the project..."
pnpm run build

# Set up Git hooks (if not already set up)
echo "Setting up Git hooks..."
if [ -f "node_modules/.bin/husky" ]; then
	pnpm run prepare 2>/dev/null || echo "Husky already set up or not needed"
fi

# Verify installation
echo "Verifying installation..."
pnpm test:format || echo "Format check failed; run pnpm format before committing."
pnpm test:types || echo "Type check failed; fix TypeScript errors before committing."

# Create example .env file if it doesn't exist
if [ ! -f .env ]; then
	echo "Creating example .env file..."
	cp .env.example .env
	echo "Edit .env with your provider API keys before running hosted models."
fi

# Print environment information
echo ""
echo "Environment information:"
echo "   Node.js version: $(node --version)"
echo "   pnpm version: $(pnpm --version)"
echo "   Biome version: $(biome --version 2>/dev/null || echo 'Not found')"
echo ""

echo "Development environment ready."
echo ""
echo "Next steps:"
echo "   1. Configure your AI providers in .env or agents.config.json"
echo "   2. Run 'pnpm run dev' to start development mode"
echo "   3. Run 'pnpm test:all' to run all tests"
echo "   4. Run 'pnpm run start' to launch OpenCub from dist/cli.js"
echo ""
