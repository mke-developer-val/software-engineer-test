#!/bin/bash

set -e

echo "========================================="
echo "Heading Checker - AWS SAM Deployment"
echo "========================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "Error: AWS SAM CLI is not installed. Please install it first."
    echo "Install with: pip install aws-sam-cli"
    exit 1
fi

# Configuration
STACK_NAME="${1:-heading-checker-stack}"
REGION="${2:-us-east-1}"

echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"
echo ""

# Step 1: Install backend dependencies
echo "Step 1: Installing backend dependencies..."
cd backend
npm install
cd ..
echo "Backend dependencies installed"
echo ""

# Step 2: Build SAM application
echo "Step 2: Building SAM application..."
sam build
echo "SAM application built"
echo ""

# Step 3: Deploy SAM application
echo "Step 3: Deploying SAM application..."
sam deploy \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset

echo "SAM application deployed"
echo ""

# Step 4: Get outputs
echo "Step 4: Retrieving deployment outputs..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)

WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
  --output text)

echo "API URL: $API_URL"
echo "S3 Bucket: $BUCKET_NAME"
echo "Website URL: $WEBSITE_URL"
echo ""

# Step 5: Build frontend with API URL
echo "Step 5: Building frontend with API URL..."
cd frontend
npm install --legacy-peer-deps

# Create .env file with API URL
echo "VITE_API_URL=$API_URL" > .env

npm run build
cd ..
echo "✓ Frontend built with API URL: $API_URL"
echo ""

# Step 6: Deploy frontend to S3
echo "Step 6: Deploying frontend to S3..."
aws s3 sync frontend/dist/ s3://$BUCKET_NAME/ --delete --region "$REGION"
echo "Frontend deployed to S3"
echo ""

# Step 7: Summary
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "API Gateway URL: $API_URL"
echo "Website URL: $WEBSITE_URL"
echo ""
echo "To test the API:"
echo "curl -X POST $API_URL/analyze -H 'Content-Type: application/json' -d '{\"url\":\"https://example.com\"}'"
echo ""
echo "Open the website in your browser:"
echo "$WEBSITE_URL"
echo ""
echo "The website is pre-configured with the API URL."
echo "Just enter a URL to analyze and click 'Analyze'!"
echo ""
