pipeline {
    agent any
    
    environment {
        PROJECT_NAME = 'history-ai'
        ENVIRONMENT = 'prod'
        AWS_REGION = 'ap-northeast-2'
        BUCKET_NAME = "${PROJECT_NAME}-${ENVIRONMENT}-s3-frontend"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '=== Checking out code ==='
                checkout scm
            }
        }
        
        stage('Build Frontend with Docker') {
            steps {
                echo '=== Building frontend with Docker ==='
                sh '''
                    # Docker로 빌드
                    docker run --rm \
                        -v $(pwd):/app \
                        -w /app \
                        node:18-alpine \
                        sh -c "npm install && npm run build"
                    
                    # 빌드 결과 확인
                    ls -la dist/ || ls -la build/
                '''
            }
        }
        
        stage('Deploy to S3') {
            steps {
                echo '=== Deploying to S3 ==='
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials'
                ]]) {
                    sh '''
                        echo "Uploading to bucket: ${BUCKET_NAME}"
                        
                        # 빌드 디렉토리 확인 (dist 또는 build)
                        if [ -d "dist" ]; then
                            BUILD_DIR="dist"
                        elif [ -d "build" ]; then
                            BUILD_DIR="build"
                        else
                            echo "❌ Build directory not found!"
                            exit 1
                        fi
                        
                        echo "Using build directory: ${BUILD_DIR}"
                        
                        # Upload all files except index.html with long cache
                        aws s3 sync ${BUILD_DIR}/ s3://${BUCKET_NAME}/ \
                            --delete \
                            --cache-control "public, max-age=31536000" \
                            --exclude "index.html" \
                            --region ${AWS_REGION}
                        
                        # Upload index.html with no-cache
                        aws s3 cp ${BUILD_DIR}/index.html s3://${BUCKET_NAME}/index.html \
                            --cache-control "no-cache, no-store, must-revalidate" \
                            --region ${AWS_REGION}
                        
                        echo "✅ Frontend uploaded to S3!"
                    '''
                }
            }
        }
        
        stage('Invalidate CloudFront') {
            steps {
                echo '=== Invalidating CloudFront cache ==='
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials'
                ]]) {
                    sh '''
                        # Find CloudFront distribution
                        DISTRIBUTION_ID=$(aws cloudfront list-distributions \
                            --query "DistributionList.Items[?Comment=='${PROJECT_NAME} ${ENVIRONMENT} distribution'].Id" \
                            --output text 2>/dev/null || echo "")
                        
                        if [ -z "$DISTRIBUTION_ID" ]; then
                            echo "⚠️ CloudFront distribution not found. Skipping invalidation."
                            exit 0
                        fi
                        
                        echo "Distribution ID: ${DISTRIBUTION_ID}"
                        
                        # Create invalidation
                        aws cloudfront create-invalidation \
                            --distribution-id ${DISTRIBUTION_ID} \
                            --paths "/*" \
                            --no-cli-pager
                        
                        echo "✅ CloudFront cache invalidation started!"
                        
                        # Get CloudFront URL
                        CLOUDFRONT_URL=$(aws cloudfront get-distribution \
                            --id ${DISTRIBUTION_ID} \
                            --query 'Distribution.DomainName' \
                            --output text 2>/dev/null || echo "unknown")
                        
                        echo "🌐 Frontend URL: https://${CLOUDFRONT_URL}"
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Frontend deployment succeeded!'
        }
        failure {
            echo '❌ Frontend deployment failed!'
        }
        always {
            // Clean up build artifacts
            sh '''
                rm -rf dist/ build/ node_modules/ || true
            '''
        }
    }
}