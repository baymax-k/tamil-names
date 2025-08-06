#!/bin/bash

# Tamil Names Website Deployment Script

echo "🚀 Starting Tamil Names Website..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if database exists, if not create it
if [ ! -f "database/tamil_names.db" ]; then
    echo "🗄️ Setting up database..."
    node setup-database.js
fi

# Start the server
echo "🌟 Starting server on port 3000..."
echo "🌐 Website URL: http://localhost:3000"
echo "⚙️ Admin Panel: http://localhost:3000/admin.html"
echo ""
echo "📝 Features available:"
echo "   ✅ Vote toggle functionality (click to vote/unvote)"
echo "   ✅ Community name submissions"
echo "   ✅ Admin moderation panel"
echo "   ✅ Favorites management"
echo "   ✅ Advanced filtering and search"
echo "   ✅ Mobile responsive design"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start the production server
npm start
