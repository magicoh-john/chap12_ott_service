/**
 * 데이터베이스 쿼리는 서버가 시작될 때 한 번 실행되며, 결과는 콘솔에 로그됩니다.
 */

console.log("1"); 

// Node.js + Mariadb 연동
let mariadb = require('mariadb');   // MariaDB 모듈 로드
const pool = mariadb.createPool({   // 커넥션 풀 객체 생성
    host: "localhost",
    user: "root",
    password: "1234",
    database: "board",
});

console.log("2"); 

// 커넥션 풀을 얻어오고 쿼리를 실행하는 비동기 함수 선언
async function asyncFunction() {
    let conn;
    console.log("4"); 
    try {
        conn = await pool.getConnection(); // 커넥션 풀로부터 하나의 커넥션을 얻어옴.
        console.log("4-1 커넥션 획득"); 
        // 커넥션을 통해서 쿼리 실행
        const rows = await conn.query("SELECT * FROM board ORDER BY bno desc LIMIT 5 OFFSET 9");
        console.log("4-2 쿼리 실행"); 
        console.log(rows); 
        console.log("4-3 쿼리 실행 결과 출력"); 
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end(); // 커넥션 반납
        console.log("4-4 커넥션 반납"); 
    }
}

console.log("3"); 

// 비동기 함수 호출
asyncFunction();

console.log("5"); 

const express = require('express');
const app = express();

console.log("6"); 

/**
 * 서버가 정상적으로 구동되고 요청을 받을 준비가 되었을 때
 * 콜백 함수가 실행된다. 그래서 맨 나중에 0번이 출력됨.
 */
app.listen(8080, function(){
    console.log("0");
    console.log('포트 8080으로 서버 대기중....')
})

app.get('/book', function(req, res){
    res.send('도서 목록 관련 페이지입니다.');
})

app.get('/', function(req, res){
    console.log("8"); 
    res.sendFile(__dirname + '/index.html');
});


console.log("7"); 