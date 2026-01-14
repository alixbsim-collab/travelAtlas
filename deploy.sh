#!/bin/bash

# Travel Atlas Deployment Script
# This script commits changes and pushes to GitHub
# GitHub will automatically trigger Cloudflare and Render deployments

set -e

echo "🚀 Travel Atlas Deployment"
echo "=========================="
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if [[ -z $(git status -s) ]]; then
    echo "ℹ️  No changes to commit"
    echo "✅ Repository is up to date"
    exit 0
fi

# Show what will be committed
echo "📋 Changes to be committed:"
git status -s
echo ""

# Ask for commit message
read -p "💬 Enter commit message (or press Enter for default): " commit_msg

if [ -z "$commit_msg" ]; then
    commit_msg="Deploy: Update Travel Atlas"
fi

# Add all changes
echo "📦 Staging changes..."
git add .

# Commit
echo "💾 Creating commit..."
git commit -m "$commit_msg

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to GitHub
echo "🚢 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📊 Monitor deployments:"
echo "   Frontend (Cloudflare): https://dash.cloudflare.com/"
echo "   Backend (Render): https://dashboard.render.com/"
echo ""
echo "🌍 Your changes will be live in a few minutes!"
