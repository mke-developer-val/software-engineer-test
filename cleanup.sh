#!/bin/bash

set -e

echo "========================================="
echo "Heading Checker - AWS Cleanup"
echo "========================================="
echo ""

# Configuration
STACK_NAME="${1:-heading-checker-stack}"
REGION="${2:-us-east-1}"

echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"
echo ""

# Check if stack exists
if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" &> /dev/null; then
    echo "Stack '$STACK_NAME' does not exist in region '$REGION'"
    exit 0
fi

# Step 1: Get S3 bucket name
echo "Step 1: Getting S3 bucket name..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)

if [ -n "$BUCKET_NAME" ]; then
    echo "Found bucket: $BUCKET_NAME"

    # Step 2: Empty S3 bucket
    echo "Step 2: Emptying S3 bucket..."
    aws s3 rm s3://$BUCKET_NAME --recursive --region "$REGION"
    echo "S3 bucket emptied"
else
    echo "No S3 bucket found"
fi
echo ""

# Step 3: Delete CloudFormation stack
echo "Step 3: Deleting CloudFormation stack..."
aws cloudformation delete-stack \
  --stack-name "$STACK_NAME" \
  --region "$REGION"

echo "Waiting for stack deletion to complete..."
aws cloudformation wait stack-delete-complete \
  --stack-name "$STACK_NAME" \
  --region "$REGION"

echo "Stack deleted"
echo ""

echo "========================================="
echo "Cleanup Complete!"
echo "========================================="
echo ""
echo "All resources have been deleted:"
echo "- Lambda function"
echo "- API Gateway"
echo "- S3 bucket"
echo "- CloudFormation stack"
echo ""
