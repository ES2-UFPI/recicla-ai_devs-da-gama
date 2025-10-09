
import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress, MenuItem } from '@mui/material';
import { AuthLayout } from '../../layouts/AuthLayout';

const roles = [
  { value: 'produtor', label: 'Produtor' },
  { value: 'coletor', label: 'Coletor' },
  { value: 'receptor', label: 'Receptor' },
];

export default function Cadastro() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmacaoSenha: '',
    role: '',
    cidade: '',
    estado: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados e cidades do IBGE
  const [estados, setEstados] = useState<Array<{ sigla: string; nome: string }>>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [loadingEstados, setLoadingEstados] = useState(true);
  const [loadingCidades, setLoadingCidades] = useState(false);

  // Buscar estados ao montar
  useEffect(() => {
    setLoadingEstados(true);
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => {
        setEstados(data.map((uf: any) => ({ sigla: uf.sigla, nome: uf.nome })));
        setLoadingEstados(false);
      })
      .catch(() => setLoadingEstados(false));
  }, []);

  // Buscar cidades ao mudar estado
  useEffect(() => {
    if (!form.estado) {
      setCidades([]);
      return;
    }
    setLoadingCidades(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado}/municipios`)
      .then(res => res.json())
      .then(data => {
        setCidades(data.map((cidade: any) => cidade.nome));
        setLoadingCidades(false);
      })
      .catch(() => setLoadingCidades(false));
  }, [form.estado]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (form.senha !== form.confirmacaoSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    // Simulação de cadastro (substitua por chamada real à API)
    setTimeout(() => {
      setLoading(false);
      setSuccess('Cadastro realizado com sucesso!');
    }, 1200);
  };

  return (
    <AuthLayout title="Criar conta no ReciclaAi" subtitle="Preencha os dados para se cadastrar">
      <Box component="form" onSubmit={handleSubmit} autoComplete="on" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField
          label="Nome completo"
          name="nome"
          value={form.nome}
          onChange={handleChange}
          required
          fullWidth
          autoComplete="name"
        />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label="Telefone"
          name="telefone"
          type="tel"
          value={form.telefone}
          onChange={handleChange}
          required
          fullWidth
          autoComplete="tel"
        />
        <TextField
          label="Senha"
          name="senha"
          type="password"
          value={form.senha}
          onChange={handleChange}
          required
          fullWidth
          autoComplete="new-password"
        />
        <TextField
          label="Confirmação de senha"
          name="confirmacaoSenha"
          type="password"
          value={form.confirmacaoSenha}
          onChange={handleChange}
          required
          fullWidth
          autoComplete="new-password"
        />
        <TextField
          select
          label="Tipo de usuário"
          name="role"
          value={form.role}
          onChange={handleChange}
          required
          fullWidth
        >
          {roles.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Estado"
          name="estado"
          value={form.estado}
          onChange={handleChange}
          required
          fullWidth
          disabled={loadingEstados}
          helperText={loadingEstados ? 'Carregando estados...' : ''}
        >
          {estados.map((uf) => (
            <MenuItem key={uf.sigla} value={uf.sigla}>{uf.nome} ({uf.sigla})</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Cidade"
          name="cidade"
          value={form.cidade}
          onChange={handleChange}
          required
          fullWidth
          disabled={!form.estado || loadingCidades}
          helperText={form.estado && loadingCidades ? 'Carregando cidades...' : ''}
        >
          {cidades.map((cidade) => (
            <MenuItem key={cidade} value={cidade}>{cidade}</MenuItem>
          ))}
        </TextField>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={loading}
          sx={{ mt: 1, fontWeight: 600 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Cadastrar'}
        </Button>
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
          Já tem uma conta? <a href="/login" style={{ color: '#388e3c', textDecoration: 'underline' }}>Entrar</a>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
