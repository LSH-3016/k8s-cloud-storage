import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
      setError('영문, 숫자, -, _ 만 사용 가능합니다');
      return;
    }

    localStorage.setItem('username', nickname.trim());
    onLogin(nickname.trim());
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Cloud Storage</h1>
        <p>닉네임을 입력하세요</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError('');
            }}
            placeholder="nickname"
            maxLength={20}
            autoFocus
          />
          {error && <div className="error">{error}</div>}
          <button type="submit">시작하기</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
