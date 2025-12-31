pipeline {
    agent any
    
    environment {
        PROJECT_NAME = 'history-ai'
        ENVIRONMENT = 'prod'
        AWS_REGION = 'ap-northeast-2'
        BUCKET_NAME = "${PROJECT_NAME}-${ENVIRONMENT}-s3-frontend"
        NODE_VERSION = '18'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '=== Checking out code ==='
                checkout scm
            }
        }
        
        stage('Setup Node.js') {
            steps {
                echo '=== Setting up Node.js ==='
                sh '''
                    node --version || echo "Node.js not found"
                    npm --version || echo "npm not found"
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo '=== Installing dependencies ==='
                sh '''
                    npm install
                '''
            }
        }
        
        stage('Build Frontend') {
            steps {
                echo '=== Building frontend ==='
                sh '''
                    npm run build
                    ls -la dist/
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
                            --output text \
                            --region ${AWS_REGION})
                        
                        if [ -z "$DISTRIBUTION_ID" ]; then
                            echo "⚠️ CloudFront distribution not found. Skipping invalidation."
                            exit 0
                        fi
                        
                        echo "Distribution ID: ${DISTRIBUTION_ID}"
                        
                        # Create invalidation
                        aws cloudfront create-invalidation \
                            --distribution-id ${DISTRIBUTION_ID} \
                            --paths "/*" \
                            --region ${AWS_REGION} \
                            --no-cli-pager
                        
                        echo "✅ CloudFront cache invalidation started!"
                        
                        # Get CloudFront URL
                        CLOUDFRONT_URL=$(aws cloudfront get-distribution \
                            --id ${DISTRIBUTION_ID} \
                            --query 'Distribution.DomainName' \
                            --output text)
                        
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
            // Clean up node_modules if needed
            sh 'echo "Deployment completed"'
        }
    }
}
