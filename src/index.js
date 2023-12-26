import React from 'react';
import ReactDOM from 'react-dom';
import './App.css'; // 애플리케이션의 스타일시트
import App from './App'; // App 컴포넌트

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
