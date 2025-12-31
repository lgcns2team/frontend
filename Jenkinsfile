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
                    # Jenkins workspace를 호스트 경로로 변환
                    # /var/jenkins_home은 호스트의 docker volume에 마운트됨
                    WORKSPACE_PATH="${WORKSPACE}"
                    
                    echo "Building in: ${WORKSPACE_PATH}"
                    ls -la
                    
                    # 직접 npm 명령어 실행 (Docker 없이)
                    # Jenkins 컨테이너 안에서 직접 실행
                    
                    # Node.js 이미지를 사용하되, 파일을 복사하는 방식
                    docker run --rm \
                        -v jenkins_home:/var/jenkins_home:ro \
                        -v $(pwd):/build \
                        -w /build \
                        node:18-alpine \
                        sh -c "npm ci && npm run build"
                    
                    # 빌드 결과 확인
                    if [ -d "dist" ]; then
                        echo "✅ Build successful!"
                        ls -la dist/
                    else
                        echo "❌ Build failed!"
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
                            echo "⚠️ CloudFront not found"
                            exit 0
                        fi
                        
                        aws cloudfront create-invalidation \
                            --distribution-id ${DISTRIBUTION_ID} \
                            --paths "/*" \
                            --no-cli-pager
                        
                        echo "✅ CloudFront invalidated!"
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