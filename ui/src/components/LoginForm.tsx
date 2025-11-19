import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

export function LoginForm() {
  // Estado local del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Estado global de autenticación
  const { login, isLoading, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpiamos errores previos
    
    try {
      await login(email, password); // Intentamos login
    } catch (err) {
      setError('Invalid credentials'); // Mostramos error si falla
    }
  };

  // Si el usuario ya está autenticado, mostramos mensaje de bienvenida
  if (user) {
    return <div>Welcome, {user.email}!</div>;
  }

  // Si no, mostramos el formulario
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="email"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="password"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div role="alert">{error}</div>}
    </form>
  );
}
