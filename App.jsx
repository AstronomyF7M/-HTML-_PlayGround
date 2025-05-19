// React frontend with authentication, game CRUD, and AI generator stub
import React, { useState, useEffect } from 'react';

const API = 'http://localhost:4000/api';

function useToken() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const saveToken = t => {
    setToken(t);
    localStorage.setItem('token', t);
  };
  return [token, saveToken];
}

function App() {
  const [token, setToken] = useToken();
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [editing, setEditing] = useState(null);
  const [html, setHtml] = useState('');
  const [name, setName] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [register, setRegister] = useState(false);

  useEffect(() => {
    fetch(API + '/games')
      .then(r => r.json())
      .then(setGames);
  }, []);

  useEffect(() => {
    if (token) {
      const [, payload] = token.split('.');
      setUser(JSON.parse(atob(payload)));
    }
  }, [token]);

  const authHeaders = token ? { Authorization: 'Bearer ' + token } : {};

  function login(e) {
    e.preventDefault();
    fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
    })
      .then(r => r.json())
      .then(d => d.token && setToken(d.token));
  }

  function registerUser(e) {
    e.preventDefault();
    fetch(API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
    }).then(() => setRegister(false));
  }

  function createOrUpdateGame(e) {
    e.preventDefault();
    const data = { name, html };
    if (editing) {
      fetch(`${API}/games/${editing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(data),
      })
        .then(r => r.json())
        .then(updated => {
          setGames(games.map(g => (g._id === updated._id ? updated : g)));
          setEditing(null);
          setHtml('');
          setName('');
        });
    } else {
      fetch(API + '/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(data),
      })
        .then(r => r.json())
        .then(newGame => {
          setGames([...games, newGame]);
          setHtml('');
          setName('');
        });
    }
  }

  function deleteGame(id) {
    fetch(`${API}/games/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    }).then(() => setGames(games.filter(g => g._id !== id)));
  }

  function aiGenerate() {
    // Replace with real AI call (OpenAI API, etc.)
    setName('My AI Game');
    setHtml('<h1>Hello World Game (AI)</h1>');
  }

  if (!token) {
    return (
      <div>
        <h2>{register ? 'Register' : 'Login'} to HTML Playground</h2>
        <form onSubmit={register ? registerUser : login}>
          <input
            placeholder="Username"
            value={loginForm.username}
            onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
          /><br />
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
          /><br />
          <button type="submit">{register ? 'Register' : 'Login'}</button>
        </form>
        <button onClick={() => setRegister(!register)}>
          {register ? 'Have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>HTML Playground</h1>
      <h3>Welcome, {user?.username}!</h3>
      <button onClick={() => setToken('')}>Logout</button>
      <hr />
      <form onSubmit={createOrUpdateGame}>
        <input
          placeholder="Game name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <br />
        <textarea
          rows={8}
          cols={60}
          placeholder="Paste/import your HTML code here"
          value={html}
          onChange={e => setHtml(e.target.value)}
        />
        <br />
        <button type="button" onClick={aiGenerate}>AI Generate Example</button>
        <button type="submit">{editing ? 'Update' : 'Publish'} Game</button>
        {editing && <button type="button" onClick={() => setEditing(null)}>Cancel</button>}
      </form>
      <hr />
      <h2>Published Games</h2>
      {games.map(game => (
        <div key={game._id} style={{ border: '1px solid #ccc', margin: '8px', padding: '8px' }}>
          <strong>{game.name}</strong> by {game.author.username}
          <button onClick={() => {
            setEditing(game);
            setName(game.name);
            setHtml(game.html);
          }} disabled={game.author._id !== user.id}>Edit</button>
          <button onClick={() => deleteGame(game._id)} disabled={game.author._id !== user.id}>Delete</button>
          <details>
            <summary>Show HTML</summary>
            <pre>{game.html}</pre>
          </details>
          <iframe srcDoc={game.html} title={game.name} style={{ width: '300px', height: '200px', border: '1px solid #444' }}></iframe>
        </div>
      ))}
    </div>
  );
}

export default App;
