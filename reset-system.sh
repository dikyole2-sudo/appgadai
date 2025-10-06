#!/bin/bash

echo "🧹 Starting Pegadaian System Reset..."
echo ""

# Step 1: Clear all data
echo "📊 Step 1: Clearing all database data..."
npx tsx scripts/clear-database.ts

if [ $? -eq 0 ]; then
    echo "✅ Database cleared successfully"
else
    echo "❌ Failed to clear database"
    exit 1
fi

echo ""

# Step 2: Seed default data
echo "🌱 Step 2: Seeding default data..."
npx tsx scripts/seed-default.ts

if [ $? -eq 0 ]; then
    echo "✅ Default data seeded successfully"
else
    echo "❌ Failed to seed default data"
    exit 1
fi

echo ""
echo "🎉 Pegadaian System Reset Complete!"
echo "📱 System is now ready for fresh use"
echo ""
echo "🔐 Login Credentials:"
echo "   Email: admin@mandirigadai.id"
echo "   Password: admin123"
echo ""
echo "🌐 Access the system at: http://localhost:3000"
echo ""