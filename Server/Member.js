const express = require('express');
const mariadb = require('mariadb');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

const pool = mariadb.createPool({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "board",
    bigIntAsNumber: true
});

// EJS를 템플릿 엔진으로 설정
app.set('view engine', 'ejs'); 
// view 들이 위치한 경로 설정(앞의 views는 Key 역할로 수정불가 뒤의 경로는 실제 폴더)
app.set('views', 'D:\\reactworks\\chap12_ott_service\\views');

// 회원 목록 조회 비동기 메소드
async function getMemberList() {
    let conn;
    try {
        conn = await pool.getConnection();
        const members = await conn.query("SELECT * FROM member");
        return members;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// 회원 상세 정보 조회 비동기 메소드
async function getMemberDetail(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        const member = await conn.query("SELECT * FROM member WHERE id = ?", [id]);
        return member[0];
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// 회원 목록 조회 라우트 메소드
app.get('/member/list', async function(req, res) {
    try {
        const members = await getMemberList();
        res.render('memberList', {members});
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// 회원 상세보기 라우트 메소드
app.get('/member/:id/detail', async function(req, res) {
    try {
        const id = req.params.id;
        const member = await getMemberDetail(id);
        if (member) {
            res.render('memberDetail', {member});
        } else {
            res.status(404).send('Member not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// 회원 등록을 처리하는 비동기 함수
async function createMember(id, password, name, email, phone) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("INSERT INTO member(id, password, name, email, phone) VALUES (?, ?, ?, ?, ?)", [id, password, name, email, phone]);
        return id;  // 생성된 회원의 ID 반환
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// 회원 등록 페이지로 이동하는 라우트[get 요청]
app.get('/member/register', async function(req, res) {
    res.render('memberRegister');  // 회원 등록 EJS 템플릿 렌더링
});

// 회원 등록(저장) 처리 라우트 메소드[post 요청]
app.post('/member/register', csrfProtection, async function(req, res) {
    try {
        const { id, password, name, email, phone } = req.body;
        await createMember(id, password, name, email, phone);  // 회원 등록 처리
        res.redirect('/member/' + id + '/detail');  // 생성된 회원 상세 페이지로 리다이렉트
    } catch (err) {
        console.error(err);
        res.status(500).send("회원 등록 중 오류 발생");
    }
});

// 회원 수정 페이지로 이동하는 라우트[get 요청]
app.get('/member/:id/edit', async function(req, res) {
    try {
        const id = req.params.id;
        const member = await getMemberDetail(id);
        if (member) {
            res.render('memberEdit', {member});  // 회원 수정 EJS 템플릿 렌더링
        } else {
            res.status(404).send('회원을 찾을 수 없습니다.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("서버 에러 발생");
    }
});

// 회원 수정 처리 라우트[post 요청]
app.post('/member/:id/update', csrfProtection, async function(req, res) {
    try {
        const id = req.params.id;
        const { password, name, email, phone } = req.body;
        await pool.query("UPDATE member SET password=?, name=?, email=?, phone=? WHERE id = ?", [password, name, email, phone, id]);
        res.redirect('/member/' + id + '/detail');  // 수정 후 회원 상세 페이지로 리다이렉트
    } catch (err) {
        console.error(err);
        res.status(500).send("회원 수정 중 오류 발생");
    }
});

// 회원 삭제 처리 라우트
app.post('/member/:id/delete', async function(req, res) {
    try {
        const id = req.params.id;
        await pool.query("DELETE FROM member WHERE id = ?", [id]);
        res.redirect('/member/list');  // 삭제 후 회원 목록으로 리다이렉트
    } catch (err) {
        console.error(err);
        res.status(500).send("회원 삭제 중 오류 발생");
    }
});














app.listen(8081, function(){
    console.log('Server is running on port 8080');
});
