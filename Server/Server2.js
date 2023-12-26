console.log("1"); 

const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "board",
});

console.log("2"); 

// 전체 회원수 저장 글로벌 변수
let count = 0;

async function asyncFunction() {
    let conn;
    console.log("4"); 
    try {
        conn = await pool.getConnection();
        console.log("4-1 커넥션 획득");

        // 회원 수를 조회하는 쿼리로 수정
        const result = await conn.query("SELECT COUNT(*) AS count FROM board"); // 'board' 테이블의 회원 수를 조회
        count = Number(result[0].count); // 결과에서 회원 수 추출
        console.log("4-2 쿼리 실행");
        console.log("회원 수: ", count); 
        console.log("4-3 쿼리 실행 결과 출력"); 
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release(); // 커넥션 반납 (release 사용)
        console.log("4-4 커넥션 반납"); 
    }
}

console.log("3"); 

/*
asyncFunction();
console.log('전체 회원 수는 : ', count);
console.log("5"); 
*/

//
asyncFunction().then(() => {
    console.log("5 - 회원 수:", count); // 비동기 함수가 완료된 후 회원 수 출력
});

console.log("6"); 

const express = require('express');
const app = express();

app.listen(8080, function(){
    console.log("0");
    console.log('포트 8080으로 서버 대기중....')
});

app.get('/book', function(req, res){
    res.send('도서 목록 관련 페이지입니다.');
});

app.get('/', function(req, res){
    console.log("8"); 
    res.sendFile(__dirname + '/index.html');
});

console.log("7"); 
