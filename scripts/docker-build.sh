#!/bin/bash

# Docker Build Script
# Builds and tags the Docker image for production

set -e

IMAGE_NAME="ai-pic-center"
VERSION="${1:-latest}"

echo "🔨 Building Docker image: ${IMAGE_NAME}:${VERSION}"

# Build the image
docker build -t ${IMAGE_NAME}:${VERSION} .

# Also tag as latest if not already latest
if [ "$VERSION" != "latest" ]; then
  docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:latest
fi

echo "✅ Build complete!"
echo "📦 Image: ${IMAGE_NAME}:${VERSION}"
echo ""
echo "To run:"
echo "  docker-compose up -d"
echo ""
echo "To push to registry:"
echo "  docker tag ${IMAGE_NAME}:${VERSION} your-registry/${IMAGE_NAME}:${VERSION}"
echo "  docker push your-registry/${IMAGE_NAME}:${VERSION}"

