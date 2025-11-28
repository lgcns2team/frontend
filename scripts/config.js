// 환경변수 설정 로드
class Config {
    constructor() {
        this.apiKey = '';
        this.provider = 'openai';
        this.ollamaUrl = 'http://localhost:11434';
        this.loadFromEnvFile();
    }

    // .env 파일에서 설정 로드
    async loadFromEnvFile() {
        try {
            const response = await fetch('.env');
            if (response.ok) {
                const text = await response.text();
                const lines = text.split('\n');
                
                lines.forEach(line => {
                    line = line.trim();
                    // 주석이나 빈 줄 제외
                    if (line && !line.startsWith('#')) {
                        const [key, ...valueParts] = line.split('=');
                        const value = valueParts.join('=').trim();
                        
                        if (key === 'OPENAI_API_KEY' && value) {
                            this.apiKey = value;
                        } else if (key === 'OLLAMA_URL' && value) {
                            this.ollamaUrl = value;
                        } else if (key === 'AI_PROVIDER' && value) {
                            this.provider = value;
                        }
                    }
                });
                
                console.log('✅ .env 파일에서 설정을 불러왔습니다.');
            } else {
                console.log('⚠️ .env 파일이 없습니다. 로컬 스토리지를 확인합니다.');
                this.loadFromStorage();
            }
        } catch (e) {
            console.log('⚠️ .env 파일 로드 실패. 로컬 스토리지를 사용합니다.');
            this.loadFromStorage();
        }
    }

    // 로컬 스토리지에서 설정 로드
    loadFromStorage() {
        try {
            const savedConfig = localStorage.getItem('aiConfig');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.apiKey = config.apiKey || '';
                this.provider = config.provider || 'openai';
                this.ollamaUrl = config.ollamaUrl || 'http://localhost:11434';
            }
        } catch (e) {
            console.log('설정 로드 실패:', e);
        }
    }

    // 로컬 스토리지에 설정 저장
    saveToStorage() {
        try {
            const config = {
                apiKey: this.apiKey,
                provider: this.provider,
                ollamaUrl: this.ollamaUrl
            };
            localStorage.setItem('aiConfig', JSON.stringify(config));
        } catch (e) {
            console.log('설정 저장 실패:', e);
        }
    }

    // API 키 설정
    setApiKey(key) {
        this.apiKey = key;
        this.saveToStorage();
    }

    // Provider 설정
    setProvider(provider) {
        this.provider = provider;
        this.saveToStorage();
    }

    // Ollama URL 설정
    setOllamaUrl(url) {
        this.ollamaUrl = url;
        this.saveToStorage();
    }

    // 현재 설정 반환
    getConfig() {
        return {
            apiKey: this.apiKey,
            provider: this.provider,
            ollamaUrl: this.ollamaUrl,
            enabled: this.apiKey ? true : false
        };
    }
}

// 전역 Config 인스턴스
const appConfig = new Config();
