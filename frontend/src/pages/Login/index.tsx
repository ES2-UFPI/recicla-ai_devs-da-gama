import { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { AuthLayout } from '../../layouts/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Simulação de login (substitua por chamada real à API)
    setTimeout(() => {
      setLoading(false);
      if (email === 'demo@recicla.ai' && password === '123456') {
        // Redirecionar ou setar auth
        alert('Login realizado com sucesso!');
      } else {
        setError('E-mail ou senha inválidos.');
      }
    }, 1000);
  };

  return (
    <AuthLayout title="Entrar no ReciclaAi" subtitle="Acesse sua conta para continuar">
      <Box component="form" onSubmit={handleSubmit} autoComplete="on" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="E-mail"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
          fullWidth
          autoComplete="email"
        />
        <TextField
          label="Senha"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          fullWidth
          autoComplete="current-password"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={loading}
          sx={{ mt: 1, fontWeight: 600 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
        </Button>
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
          Esqueceu a senha? <a href="#" style={{ color: '#388e3c', textDecoration: 'underline' }}>Recuperar acesso</a>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
