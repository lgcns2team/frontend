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
        
        stage('Verify Structure') {
            steps {
                echo '=== Verifying repository structure ==='
                sh '''
                    pwd
                    ls -la
                    cat package.json | grep "name"
                '''
            }
        }
        
        stage('Build Frontend with Docker') {
            steps {
                echo '=== Building frontend with Docker ==='
                sh '''
                    # 현재 디렉토리를 절대 경로로
                    WORKSPACE_PATH=$(pwd)
                    echo "Workspace: ${WORKSPACE_PATH}"
                    
                    # Docker로 빌드
                    docker run --rm \
                        -v "${WORKSPACE_PATH}":/app \
                        -w /app \
                        node:18-alpine \
                        sh -c "npm ci && npm run build"
                    
                    # 빌드 결과 확인
                    if [ -d "dist" ]; then
                        echo "✅ Build successful! Contents:"
                        ls -la dist/
                    else
                        echo "❌ dist directory not found!"
                        ls -la
                        exit 1
                    fi
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
                        echo "Uploading dist/ to bucket: ${BUCKET_NAME}"
                        
                        # Upload all files except index.html with long cache
                        aws s3 sync dist/ s3://${BUCKET_NAME}/ \
                            --delete \
                            --cache-control "public, max-age=31536000" \
                            --exclude "index.html" \
                            --region ${AWS_REGION}
                        
                        # Upload index.html with no-cache
                        aws s3 cp dist/index.html s3://${BUCKET_NAME}/index.html \
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
            // Clean up
            sh '''
                rm -rf dist/ node_modules/ || true
            '''
        }
    }
}