FROM node:18-slim

# Chrome 의존성 설치
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-noto-cjk \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer가 설치된 Chromium 사용하도록 설정
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 작업 디렉토리 설정
WORKDIR /app

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm install --production

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 3000

# 서버 실행
CMD ["npm", "start"]
