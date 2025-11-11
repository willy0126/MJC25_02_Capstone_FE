"use strict";

/* ===================================
   도서관 정보나루 API 서비스
   =================================== */

const LibraryAPI = {
  // API 인증키 (환경변수에서 가져오기)
  authKey: window.ENV?.OPENLIBRARY_KEY || '',

  // API 베이스 URL
  baseURL: 'https://www.data4library.kr/api',

  // 테스트 모드 (CORS 문제 발생 시 자동으로 false로 전환됨)
  useAPI: true,

  /**
   * 날짜를 YYYY-MM-DD 형식으로 변환
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * XML을 JSON으로 변환
   */
  xmlToJson(xml) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");

    // 에러 체크
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML 파싱 오류:', parserError.textContent);
      return null;
    }

    return xmlDoc;
  },

  /**
   * 도서 정보 추출
   */
  extractBookInfo(docElement, isFirst = false) {
    const getTextContent = (tagName) => {
      const element = docElement.querySelector(tagName);
      return element ? element.textContent.trim() : '';
    };

    // doc 요소의 모든 자식 태그 확인 (첫 번째 책만)
    if (isFirst) {
      const allTags = Array.from(docElement.children).map(el => el.tagName);
      if (allTags.length > 0) {
        console.log('📋 doc 요소의 모든 태그:', allTags.join(', '));
      }
    }

    // 책 이미지 URL 추출 (여러 필드명 시도)
    const coverUrl = getTextContent('bookImageURL') ||
                     getTextContent('bookimageURL') ||
                     getTextContent('bookDtlUrl') ||
                     getTextContent('image_url') ||
                     '';

    const bookData = {
      isbn: getTextContent('isbn13') || getTextContent('isbn'),
      title: getTextContent('bookname'),
      author: getTextContent('authors'),
      publisher: getTextContent('publisher'),
      publicationYear: getTextContent('publication_year'),
      cover: coverUrl,
      loanCount: parseInt(getTextContent('loan_count') || getTextContent('loanCnt') || '0'),
      ranking: parseInt(getTextContent('ranking') || '0'),
      category: getTextContent('class_nm') || getTextContent('class_no')
    };

    if (isFirst) {
      console.log('📖 첫 번째 책 정보 샘플:', {
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        loanCount: bookData.loanCount,
        cover: coverUrl ? '있음' : '없음',
        coverUrl: coverUrl ? coverUrl.substring(0, 60) + '...' : '없음'
      });
    }

    return bookData;
  },

  /**
   * 인기 대출 도서 조회
   * @param {Object} options - 조회 옵션
   * @param {string} options.startDt - 시작일 (YYYY-MM-DD)
   * @param {string} options.endDt - 종료일 (YYYY-MM-DD)
   * @param {number} options.pageNo - 페이지 번호 (기본값: 1)
   * @param {number} options.pageSize - 페이지 크기 (기본값: 10)
   */
  async getLoanBooks(options = {}) {
    // API 사용 불가 시 즉시 실패 반환
    if (!this.useAPI) {
      console.warn('API 사용 불가 상태 - 로컬 데이터를 사용하세요');
      return {
        success: false,
        error: 'API 사용 불가 (CORS 또는 이전 오류)',
        books: []
      };
    }

    try {
      // 기본값 설정 (최근 7일)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const params = new URLSearchParams({
        authKey: this.authKey,
        startDt: options.startDt || this.formatDate(startDate),
        endDt: options.endDt || this.formatDate(endDate),
        pageNo: options.pageNo || 1,
        pageSize: options.pageSize || 10,
        format: 'xml'
      });

      const url = `${this.baseURL}/loanItemSrch?${params.toString()}`;
      console.log('📡 인기 대출 도서 API 호출:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log('📄 API 원본 XML 응답 (처음 1000자):', xmlText.substring(0, 1000));

      const xmlDoc = this.xmlToJson(xmlText);

      if (!xmlDoc) {
        throw new Error('XML 파싱 실패');
      }

      // 에러 메시지 확인
      const errorElement = xmlDoc.querySelector('error');
      if (errorElement) {
        const errorMsg = errorElement.textContent;
        throw new Error(`API 에러: ${errorMsg}`);
      }

      // 도서 목록 추출
      const docs = xmlDoc.querySelectorAll('doc');
      console.log('📚 XML에서 찾은 doc 요소 개수:', docs.length);

      if (docs.length === 0) {
        console.warn('⚠️ doc 요소를 찾지 못했습니다. XML 구조 확인:');
        console.log('루트 요소:', xmlDoc.documentElement?.tagName);
        const children = Array.from(xmlDoc.documentElement?.children || []);
        console.log('자식 요소들:', children.map(el => el.tagName).join(', '));

        // response 태그 확인
        const response = xmlDoc.querySelector('response');
        if (response) {
          console.log('response 요소의 자식:', Array.from(response.children).map(el => el.tagName).join(', '));
        }
      }

      const books = Array.from(docs).map((doc, index) => this.extractBookInfo(doc, index === 0));
      console.log('✅ 추출된 책 데이터 개수:', books.length);

      // 메타 정보 추출
      const resultNum = xmlDoc.querySelector('resultNum');
      const pageNo = xmlDoc.querySelector('pageNo');
      const pageSize = xmlDoc.querySelector('pageSize');

      return {
        success: true,
        meta: {
          totalCount: resultNum ? parseInt(resultNum.textContent) : 0,
          pageNo: pageNo ? parseInt(pageNo.textContent) : 1,
          pageSize: pageSize ? parseInt(pageSize.textContent) : 10
        },
        books: books
      };

    } catch (error) {
      console.error('인기 대출 도서 조회 실패:', error);

      // CORS 오류인 경우 API 사용 중지
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        console.warn('CORS 오류 감지 - API 사용을 중지하고 로컬 데이터를 사용합니다');
        this.useAPI = false;
      }

      return {
        success: false,
        error: error.message,
        books: []
      };
    }
  },

  /**
   * 대출 급상승 도서 조회
   * @param {string} searchDt - 조회 날짜 (YYYY-MM-DD)
   */
  async getHotTrendBooks(searchDt) {
    // API 사용 불가 시 즉시 실패 반환
    if (!this.useAPI) {
      console.warn('API 사용 불가 상태 - 로컬 데이터를 사용하세요');
      return {
        success: false,
        error: 'API 사용 불가 (CORS 또는 이전 오류)',
        books: []
      };
    }

    try {
      // 기본값: 오늘 날짜
      const date = searchDt || this.formatDate(new Date());

      const params = new URLSearchParams({
        authKey: this.authKey,
        searchDt: date,
        format: 'xml'
      });

      const url = `${this.baseURL}/hotTrend?${params.toString()}`;
      console.log('📈 급상승 도서 API 호출:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log('📄 급상승 API 원본 XML 응답 (처음 1000자):', xmlText.substring(0, 1000));

      const xmlDoc = this.xmlToJson(xmlText);

      if (!xmlDoc) {
        throw new Error('XML 파싱 실패');
      }

      // 에러 메시지 확인
      const errorElement = xmlDoc.querySelector('error');
      if (errorElement) {
        const errorMsg = errorElement.textContent;
        throw new Error(`API 에러: ${errorMsg}`);
      }

      // 도서 목록 추출
      const results = xmlDoc.querySelectorAll('result');
      console.log('🚀 XML에서 찾은 result 요소 개수:', results.length);

      if (results.length === 0) {
        console.warn('⚠️ result 요소를 찾지 못했습니다. XML 구조 확인:');
        console.log('루트 요소:', xmlDoc.documentElement?.tagName);
        console.log('자식 요소들:', Array.from(xmlDoc.documentElement?.children || []).map(el => el.tagName).join(', '));
      }

      const books = Array.from(results).map((result, index) => {
        const getTextContent = (tagName) => {
          const element = result.querySelector(tagName);
          return element ? element.textContent.trim() : '';
        };

        // 책 이미지 URL 추출 (여러 필드명 시도)
        const coverUrl = getTextContent('bookImageURL') ||
                         getTextContent('bookimageURL') ||
                         getTextContent('bookDtlUrl') ||
                         getTextContent('image_url') ||
                         '';

        const bookData = {
          isbn: getTextContent('isbn13'),
          title: getTextContent('bookname'),
          author: getTextContent('authors'),
          publisher: getTextContent('publisher'),
          publicationYear: getTextContent('publication_year'),
          cover: coverUrl,
          loanCount: parseInt(getTextContent('loan_count') || getTextContent('loanCnt') || '0'),
          ranking: parseInt(getTextContent('ranking') || '0')
        };

        if (index === 0) {
          console.log('🚀 첫 번째 급상승 책 샘플:', {
            title: bookData.title,
            author: bookData.author,
            loanCount: bookData.loanCount,
            cover: coverUrl ? '있음' : '없음'
          });
        }

        return bookData;
      });

      console.log('✅ 급상승 도서 추출 완료. 책 개수:', books.length);

      return {
        success: true,
        books: books
      };

    } catch (error) {
      console.error('급상승 도서 조회 실패:', error);

      // CORS 오류인 경우 API 사용 중지
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        console.warn('CORS 오류 감지 - API 사용을 중지하고 로컬 데이터를 사용합니다');
        this.useAPI = false;
      }

      return {
        success: false,
        error: error.message,
        books: []
      };
    }
  },

  /**
   * 도서관별 인기 대출 도서 조회 (연령별)
   * @param {string} libCode - 도서관 코드
   * @param {string} age - 연령 그룹 (0: 전체, 1: 영유아, 2: 유아, 3: 초등, 4: 청소년, 5: 성인)
   */
  async getLoanBooksByLibrary(libCode, age = '0') {
    try {
      const params = new URLSearchParams({
        authKey: this.authKey,
        libCode: libCode,
        age: age,
        format: 'xml'
      });

      const url = `${this.baseURL}/extends/loanItemSrchByLib?${params.toString()}`;
      console.log('도서관별 인기 도서 API 호출:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      const xmlDoc = this.xmlToJson(xmlText);

      if (!xmlDoc) {
        throw new Error('XML 파싱 실패');
      }

      // 에러 메시지 확인
      const errorElement = xmlDoc.querySelector('error');
      if (errorElement) {
        const errorMsg = errorElement.textContent;
        throw new Error(`API 에러: ${errorMsg}`);
      }

      // 도서 목록 추출
      const docs = xmlDoc.querySelectorAll('doc');
      const books = Array.from(docs).map(doc => this.extractBookInfo(doc));

      return {
        success: true,
        books: books
      };

    } catch (error) {
      console.error('도서관별 인기 도서 조회 실패:', error);
      return {
        success: false,
        error: error.message,
        books: []
      };
    }
  }
};

// 전역 스코프에 노출
window.LibraryAPI = LibraryAPI;
