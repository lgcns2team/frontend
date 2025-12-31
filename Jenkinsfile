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
        
        stage('Install Dependencies') {
            steps {
                echo '=== Installing dependencies ==='
                sh 'npm ci'
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
                        
                        aws s3 sync dist/ s3://${BUCKET_NAME}/ \
                            --delete \
                            --cache-control "public, max-age=31536000" \
                            --exclude "index.html" \
                            --region ${AWS_REGION}
                        
                        aws s3 cp dist/index.html s3://${BUCKET_NAME}/index.html \
                            --cache-control "no-cache, no-store, must-revalidate" \
                            --region ${AWS_REGION}
                        
                        echo "✅ Uploaded to S3!"
                    '''
                }
            }
        }
        
        stage('Invalidate CloudFront') {
            steps {
                echo '=== Invalidating CloudFront ==='
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials'
                ]]) {
                    sh '''
                        DISTRIBUTION_ID=$(aws cloudfront list-distributions \
                            --query "DistributionList.Items[?Comment=='${PROJECT_NAME} ${ENVIRONMENT} distribution'].Id" \
                            --output text 2>/dev/null || echo "")
                        
                        if [ -z "$DISTRIBUTION_ID" ]; then
                            echo "⚠️ CloudFront distribution not found"
                            exit 0
                        fi
                        
                        echo "Distribution ID: ${DISTRIBUTION_ID}"
                        
                        aws cloudfront create-invalidation \
                            --distribution-id ${DISTRIBUTION_ID} \
                            --paths "/*" \
                            --no-cli-pager
                        
                        echo "✅ CloudFront cache invalidated!"
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
            sh 'rm -rf dist/ node_modules/ || true'
        }
    }
}