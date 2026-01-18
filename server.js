const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 브라우저 인스턴스 재사용
let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--hide-scrollbars',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-web-security'
      ],
      ignoreHTTPSErrors: true
    });
  }
  return browser;
}

// 팝업, 플로팅 배너, 오버레이 제거 스크립트
const removePopupsScript = `
  (function() {
    // 1. position: fixed, sticky 요소 제거 (단, 네비게이션은 유지)
    const fixedElements = document.querySelectorAll('*');
    fixedElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const position = style.getPropertyValue('position');
      const zIndex = parseInt(style.getPropertyValue('z-index')) || 0;
      
      if (position === 'fixed' || position === 'sticky') {
        const tagName = el.tagName.toLowerCase();
        const className = el.className.toString().toLowerCase();
        const id = (el.id || '').toLowerCase();
        
        // 네비게이션/헤더는 유지
        const isNavigation = 
          tagName === 'nav' || 
          tagName === 'header' ||
          className.includes('nav') ||
          className.includes('header') ||
          className.includes('gnb') ||
          className.includes('menu') ||
          id.includes('nav') ||
          id.includes('header') ||
          id.includes('gnb') ||
          id.includes('menu');
        
        // 팝업/배너/플로팅 요소 판별
        const isPopup = 
          className.includes('popup') ||
          className.includes('modal') ||
          className.includes('overlay') ||
          className.includes('banner') ||
          className.includes('floating') ||
          className.includes('float') ||
          className.includes('sticky') ||
          className.includes('fixed') ||
          className.includes('layer') ||
          className.includes('dialog') ||
          className.includes('toast') ||
          className.includes('snackbar') ||
          className.includes('notification') ||
          className.includes('cookie') ||
          className.includes('consent') ||
          className.includes('chat') ||
          className.includes('talk') ||
          className.includes('kakao') ||
          className.includes('channel') ||
          className.includes('quick') ||
          className.includes('side') ||
          className.includes('right') ||
          id.includes('popup') ||
          id.includes('modal') ||
          id.includes('overlay') ||
          id.includes('banner') ||
          id.includes('floating') ||
          id.includes('layer') ||
          id.includes('chat') ||
          id.includes('talk');
        
        // z-index가 매우 높은 요소 (오버레이)
        const isHighZIndex = zIndex > 1000;
        
        if (!isNavigation && (isPopup || isHighZIndex)) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
        }
      }
    });
    
    // 2. 일반적인 팝업/모달 클래스 제거
    const popupSelectors = [
      '[class*="popup"]',
      '[class*="modal"]',
      '[class*="overlay"]',
      '[class*="layer-popup"]',
      '[class*="floating"]',
      '[class*="float-"]',
      '[class*="quick-menu"]',
      '[class*="side-menu"]',
      '[class*="fixed-"]',
      '[class*="sticky-"]',
      '[class*="toast"]',
      '[class*="snackbar"]',
      '[class*="cookie"]',
      '[class*="consent"]',
      '[class*="chat-"]',
      '[class*="kakao"]',
      '[class*="channel"]',
      '[class*="talk"]',
      '[id*="popup"]',
      '[id*="modal"]',
      '[id*="overlay"]',
      '[id*="layer"]',
      '[id*="floating"]',
      '[id*="chat"]',
      '.dim',
      '.dimmed',
      '.backdrop',
      '[role="dialog"]',
      '[role="alertdialog"]',
      '[aria-modal="true"]'
    ];
    
    popupSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          const tagName = el.tagName.toLowerCase();
          // body, html, 기본 요소는 제외
          if (tagName !== 'body' && tagName !== 'html' && tagName !== 'head') {
            const rect = el.getBoundingClientRect();
            // 화면의 상당 부분을 차지하는 오버레이인 경우에만 제거
            if (rect.width > window.innerWidth * 0.5 || rect.height > window.innerHeight * 0.5) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
            }
            // 작은 플로팅 요소도 제거
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'sticky') {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
            }
          }
        });
      } catch(e) {}
    });
    
    // 3. 우측/하단 플로팅 버튼 제거 (카카오톡, 채팅 등)
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      // 우측 하단 고정 요소
      if ((style.position === 'fixed' || style.position === 'sticky') &&
          rect.right > window.innerWidth - 200 &&
          rect.bottom > window.innerHeight - 300 &&
          rect.width < 300 && rect.height < 400) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
      }
      
      // 좌측 하단 고정 요소
      if ((style.position === 'fixed' || style.position === 'sticky') &&
          rect.left < 200 &&
          rect.bottom > window.innerHeight - 300 &&
          rect.width < 300 && rect.height < 400) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
      }
    });
    
    // 4. body overflow 복원 (모달이 스크롤을 막은 경우)
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'auto';
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    // 5. 팝업 닫기 버튼 클릭 시도
    const closeButtons = document.querySelectorAll(
      '[class*="close"], [class*="Close"], [aria-label*="close"], [aria-label*="Close"], ' +
      '[class*="btn-close"], [class*="btn_close"], [class*="popup-close"], ' +
      'button[class*="x"], .close-btn, .closeBtn, #close, #closeBtn'
    );
    closeButtons.forEach(btn => {
      try { btn.click(); } catch(e) {}
    });
    
    return 'Popups removed';
  })();
`;

// 스크린샷 API 엔드포인트
app.get('/screenshot', async (req, res) => {
  const { url, width = 1280, height = 900, format = 'base64', fullPage = 'false' } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  let page = null;
  
  try {
    const browserInstance = await getBrowser();
    page = await browserInstance.newPage();
    
    // HTTPS 오류 무시
    await page.setBypassCSP(true);
    
    // 뷰포트 설정
    await page.setViewport({
      width: parseInt(width),
      height: parseInt(height),
      deviceScaleFactor: 1
    });
    
    // User-Agent 설정
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // 페이지 로드 (HTTPS 오류 무시)
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // 페이지 로드 후 잠시 대기 (동적 콘텐츠)
    await page.waitForTimeout(2000);
    
    // 팝업/플로팅 배너 제거
    await page.evaluate(removePopupsScript);
    
    // 추가 대기 (DOM 변경 적용)
    await page.waitForTimeout(500);
    
    // 스크린샷 촬영
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 85,
      fullPage: fullPage === 'true'
    });
    
    await page.close();
    
    if (format === 'base64') {
      res.json({
        success: true,
        screenshot: screenshot.toString('base64'),
        contentType: 'image/jpeg'
      });
    } else {
      res.set('Content-Type', 'image/jpeg');
      res.send(screenshot);
    }
    
  } catch (error) {
    console.error('Screenshot error:', error.message);
    if (page) await page.close().catch(() => {});
    
    res.status(500).json({
      error: 'Failed to capture screenshot',
      message: error.message
    });
  }
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({
    name: 'Puppeteer Screenshot API',
    version: '1.0.0',
    endpoints: {
      screenshot: 'GET /screenshot?url=<URL>&width=1280&height=900&format=base64|image&fullPage=true|false',
      health: 'GET /health'
    },
    example: '/screenshot?url=https://example.com'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Screenshot API server running on port ${PORT}`);
});

// 종료 시 브라우저 정리
process.on('SIGTERM', async () => {
  if (browser) await browser.close();
  process.exit(0);
});
