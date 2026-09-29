#!/bin/bash
set -e

echo "🛠️ Starting Manual Server Refresh..."

# 1. Enter Maintenance Mode (Users will see a "Be Right Back" page)
echo "🚧 Putting application in maintenance mode..."
php artisan down || echo "App already down"

# 2. Fix Permissions (Crucial for Digital Ocean)
# This ensures Laravel can write to logs and storage
echo "🔐 Fixing folder permissions & storage link..."
php artisan storage:link || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# 3. Clear EVERYTHING
echo "🧹 Cleaning all caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
php artisan clear-compiled

# 4. Run Database Migrations
echo "🗄️ Checking for database migrations..."
php artisan migrate --force
php artisan db:seed --class=LandingPageTemplatesSeeder --force || true

# 5. Re-optimize for Production
echo "🚀 Re-optimizing..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. Bring the application back online
echo "🌐 Bringing application back online..."
php artisan up

echo "✨ Server Refreshed and Optimized!"
