// 필요한 모듈과 라이브러리 import
const express = require('express');
// 사용 이유 검증 안됨.
// const session = require('express-session');
const mariadb = require('mariadb');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');

// Http Body에서 전송된 내용을 읽기 위한 라이브러리 import
// (Express 4.16 버전 부터는 기본 내장)
//const bodyParser = require('body-parser');

// Express 애플리케이션 초기화
const app = express();
// 쿠키 파서 사용
app.use(cookieParser());

/**
 * [사용자가 보낸 데이터 읽기]
 * 요청 객체(req)가 사용자로부터 서버에게 전송된 데이터를 
 * 쉽게 추출할 수 있도록 해주는 내장 미들웨어 함수들 설정.
 * 1. URL 인코딩된 데이터를 해석하기 위한 미들웨어
 *  - 일반적으로 HTML <form> 데이터는 Http Body에 인코딩되어 담겨서 전송됨.
 *  - { extended: true }는 복잡한 형태로 오는 데이터도 쉽게 파싱해줌.
 * 2. JSON 형식의 본문을 해석하기 위한 미들웨어
 *  - 사용자가 json 타입으로 전송한 본문을 파싱하여 JavaScript 객체로 변환한다.
 *    이를 통해 서버는 클라이언트로부터 받은 JSON 데이터를 쉽게 다룰 수 있다.
 */
// URL 인코딩된 데이터를 해석하기 위한 미들웨어
app.use(express.urlencoded({ extended: true }));
// JSON 형식의 본문을 해석하기 위한 미들웨어
app.use(express.json());

/**
 * CSRF 보호 활성화
 * csurf 라이브러리를 통해 생성된 미들웨어 함수입니다. 
 * 이 미들웨어는 들어오는 요청을 가로채 CSRF 토큰을 검증합니다. 
 * 토큰이 유효하지 않거나 누락된 경우, 요청 처리를 거부하고 오류를 반환.
 */
const csrfProtection = csurf({ cookie: true });// 쿠키에 csrf Secret을 저장. 만일 세션에 저장하고 싶다면 { cookie: false }로


// CSRF 토큰 미들웨어 추가
app.use(csrfProtection);

// 모든 요청에 대해 CSRF 토큰을 생성하여 뷰에 전달하는 미들웨어
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// MariaDB 연결 풀 설정
const pool = mariadb.createPool({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "board",
    bigIntAsNumber: true  // BigInt 값을 일반 숫자로 자동 변환
});

// EJS를 템플릿 엔진으로 설정
app.set('view engine', 'ejs'); 
// view 들이 위치한 경로 설정(앞의 views는 Key 역할로 수정불가 뒤의 경로는 실제 폴더)
app.set('views', 'D:\\reactworks\\chap12_ott_service\\views');


// 게시물 목록을 조회하는 비동기 함수
async function getBoardList() {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT * FROM board order by bno desc limit 5 offset 0");
        console.log("쿼리 결과", result);
        return result;
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        console.log("커넥션 반납");
    }
}

// 게시물 상세 정보를 조회하는 비동기 함수
async function getBoardDetail(bno) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT bno, title, content, writer, regdate, moddate FROM board WHERE bno = ?", [bno]);
        return result[0];
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
}

// 게시물 등록을 처리하는 비동기 함수
async function createBoard(title, content, writer) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("INSERT INTO board(title, content, writer) VALUES (?, ?, ?)", [title, content, writer]);
        return result.insertId; // 새로 생성된 게시물의 ID 반환
    } catch (err) {
        console.error(err);
        throw err;  // 에러를 다시 던져서 호출자가 처리할 수 있게 합니다.
    } finally {
        if (conn) conn.release();
    }
}

// 초기화면 라우트 설정
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

// 라우트 설정
// app.get('/form', csrfProtection, (req, res) => {
//     // 폼을 렌더링할 때 CSRF 토큰 전송
//     res.send(`<form action="/submit" method="POST">
//                 <input type="hidden" name="_csrf" value="${req.csrfToken()}">
//                 <input type="text" id="title" name="title" value="타이틀" required>
//                 <textarea id="content" name="content"  required>내용</textarea>
//                 <button type="submit">저장</button>
//               </form>`);
// });

/**
 * csrfProtection 미들웨어 : 들어오는 요청을 가로채 CSRF 토큰을 검증
 */
// app.post('/submit', csrfProtection, (req, res) => {
//     // CSRF 토큰 검증이 성공하면 이곳이 실행됨
//     console.log("CSRF 토큰 검증 성공");
//     res.send('Data is being processed');
// });

/**
 * 오류 처리 미들웨어[선택]
 * 모든 경로에 대한 요청에서 발생하는 오류 처리.
 */
app.use(function (err, req, res, next) {
    // CSRF 토큰 검증 오류인 경우
    if (err.code === 'EBADCSRFTOKEN') {
        // 로그에 상세 오류 정보 출력
        console.error('CSRF 토큰 오류 발생:', err.message);

        console.error('오류 발생 시간:', new Date());
        console.error('오류 메시지:', err.message);
        console.error('오류 스택:', err.stack);
        console.error('요청 메소드:', req.method);
        console.error('요청 URL:', req.url);
        console.error('요청 헤더:', req.headers);
        console.error('요청 본문:', req.body);

        // 사용자에게 응답
        res.status(403);
        res.send('CSRF 토큰이 유효하지 않습니다. 폼이 만료되었거나 잘못된 요청입니다.');
    } else {
        // 다른 종류의 오류에 대한 처리
        console.error('알 수 없는 오류 발생:', err.message);
        res.status(500);
        res.send('서버 오류가 발생했습니다.');
    }
});

// 게시물 목록 처리 핸들러
app.get('/board/list', async function(req, res){
    try {
        const posts = await getBoardList();
        res.render('boardList', {posts}); // EJS 템플릿 렌더링
    } catch (err) {
        console.error(err);
        res.status(500).send("서버 에러 발생");
    }
});

// 게시물 상세 페이지 라우트
app.get('/board/:bno/read', async function(req, res){
    try {
        const bno = parseInt(req.params.bno, 10);
        const post = await getBoardDetail(bno);
        if (post) {
            res.render('boardDetail', {post}); // EJS 템플릿 렌더링
        } else {
            res.status(404).send('게시물을 찾을 수 없습니다.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("서버 에러 발생");
    }
});

// 게시물 등록 페이지로 이동하는 라우트[get 요청]
app.get('/board/register', async function(req, res) {
    // 게시물 등록 페이지에는 post 데이터가 필요하지 않으므로 빈 객체를 전달하거나 아예 전달하지 않는다.
    res.render('boardRegister'); // 게시물 등록 EJS 템플릿 렌더링
});



/**
 * 게시물 등록(저장) 처리 라우트 메소드[post 요청]
 */
app.post('/board/register', csrfProtection, async function(req, res) {
    try {
        const { title, content, writer } = req.body;
        const bno = await createBoard(title, content, writer); // 게시물 등록 처리
        res.redirect('/board/' + bno + '/read'); // 생성된 게시물 상세 페이지로 리다이렉트
    } catch (err) {
        console.error(err);
        res.status(500).send("게시물 등록 중 오류 발생");
    }
});


// 게시물 수정 페이지로 이동하는 라우트[get 요청]
app.get('/board/:bno/edit', async function(req, res) {
    try {
        const bno = parseInt(req.params.bno, 10);
        const post = await getBoardDetail(bno);
        if (post) {
            res.render('boardEdit', {post}); // 게시물 수정 EJS 템플릿 렌더링
        } else {
            res.status(404).send('게시물을 찾을 수 없습니다.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("서버 에러 발생");
    }
});

/**
 * 게시물 수정 처리 라우트[post 요청]
 * :bno는 라우트 파라미터
 */
app.post('/board/:bno/update', csrfProtection, async function(req, res) {
    try {
        // 파라미터 bno를 10진수의 정수로 변환하여 할당
        const bno = parseInt(req.params.bno, 10);

        // 1. 구조분해할당 없이 수동으로 전달되어 온 값 추출
        //const title = req.body.title;
        //const content = req.body.content;

        // 2. 구조분해할당으로 좀더 편하게 값추출(바인딩)
        const { title, content, writer } = req.body; // title과 content는 폼에서 제출된 데이터입니다.
       
       // 3. 위의 구조분해 할당을 풀어서 쓰면
       //const { title1, content2 } = { title: "제목예시입니다", content: "내용예시입니다" }

        await pool.query("UPDATE board SET title=?, content=?, writer=? WHERE bno = ?", [title, content, writer, bno]);
        res.redirect('/board/' + bno + '/read'); // 수정 후 게시물 상세 페이지로 리다이렉트
    } catch (err) {
        console.error(err);
        res.status(500).send("게시물 수정 중 오류 발생");
    }
});


// 게시물 삭제 처리 라우트
app.post('/board/:bno/delete', async function(req, res) {
    try {
        const bno = parseInt(req.params.bno, 10);
        await pool.query("DELETE FROM board WHERE bno = ?", [bno]);
        res.redirect('/board/list'); // 삭제 후 게시물 목록으로 리다이렉트
    } catch (err) {
        console.error(err);
        res.status(500).send("게시물 삭제 중 오류 발생");
    }
});

// 서버 시작
app.listen(8080, function(){
    console.log('포트 8080으로 서버 대기중....');
});
