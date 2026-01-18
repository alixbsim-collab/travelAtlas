#!/bin/bash

# Travel Atlas - Cloudflare Pages Deployment Script
# This script builds and deploys the frontend to Cloudflare Pages

set -e  # Exit on error

echo "🚀 Starting Cloudflare Pages Deployment..."
echo ""

# Check if we're in the right directory
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found. Please run this script from the project root."
    exit 1
fi

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build completed successfully!"
echo ""

# Deploy to Cloudflare Pages
echo "☁️  Deploying to Cloudflare Pages..."
echo ""

# Check if user is logged in to Wrangler
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare..."
    wrangler login
fi

# Deploy
wrangler pages deploy frontend/build --project-name=travel-atlas

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌐 Your site should be available at:"
echo "   https://travel-atlas.pages.dev"
echo ""
echo "📝 Next steps:"
echo "   1. Set environment variables in Cloudflare Dashboard"
echo "   2. Verify the deployment works correctly"
echo "   3. Set up custom domain (optional)"
echo ""
