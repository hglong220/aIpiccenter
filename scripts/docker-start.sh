#!/bin/bash

# Docker Start Script
# Starts all services using docker-compose

set -e

echo "🚀 Starting AI Pic Center services..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
  echo "⚠️  Warning: .env.production not found"
  echo "📝 Creating .env.production from env.template..."
  cp env.template .env.production
  echo "⚠️  Please update .env.production with your actual configuration"
fi

# Start services
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check database
if docker-compose exec -T db pg_isready -U aipiccenter > /dev/null 2>&1; then
  echo "✅ Database is ready"
else
  echo "❌ Database is not ready"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
  echo "✅ Redis is ready"
else
  echo "❌ Redis is not ready"
fi

# Check app health
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✅ App is healthy"
else
  echo "⚠️  App health check failed (may still be starting)"
fi

echo ""
echo "✅ Services started!"
echo ""
echo "📊 Service URLs:"
echo "  App: http://localhost:3000"
echo "  Health: http://localhost:3000/api/health"
echo ""
echo "📝 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart: docker-compose restart"

