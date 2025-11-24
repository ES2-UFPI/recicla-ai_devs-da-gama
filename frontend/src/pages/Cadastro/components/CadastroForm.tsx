import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Box, Button, TextField, Typography, Alert, CircularProgress, MenuItem } from '@mui/material';
import { maskTelefone } from '../mask';
import {
  validateNome,
  validateEmail,
  validateTelefone,
  validateSenha,
  validateConfirmacaoSenha,
} from '../validation';
import type { RoleType } from '../types';

type Role = { value: RoleType; label: string };

interface CadastroFormData {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmacaoSenha: string;
  role: RoleType | '';
  cidade: string;
  estado: string;
}

const fallbackRoles: Role[] = [
  { value: 'produtor', label: 'Produtor' },
  { value: 'coletor', label: 'Coletor' },
  { value: 'receptor', label: 'Receptor' },
];

export function CadastroForm() {
  const { register } = useAuth();
  const [form, setForm] = useState<CadastroFormData>({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmacaoSenha: '',
    role: '',
    cidade: '',
    estado: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CadastroFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roles] = useState<Role[]>(fallbackRoles);
  const [loadingRoles] = useState(false);
  const [estados, setEstados] = useState<Array<{ sigla: string; nome: string }>>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [loadingEstados, setLoadingEstados] = useState(true);
  const [loadingCidades, setLoadingCidades] = useState(false);

  useEffect(() => {
    setLoadingEstados(true);
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => {
        setEstados(data.map((uf: { sigla: string; nome: string }) => ({ sigla: uf.sigla, nome: uf.nome })));
        setLoadingEstados(false);
      })
      .catch(() => setLoadingEstados(false));
  }, []);

  useEffect(() => {
    if (!form.estado) {
      setCidades([]);
      return;
    }
    setLoadingCidades(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado}/municipios`)
      .then(res => res.json())
      .then(data => {
        setCidades(data.map((cidade: { nome: string }) => cidade.nome));
        setLoadingCidades(false);
      })
      .catch(() => setLoadingCidades(false));
  }, [form.estado]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'nome') newValue = value.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
    if (name === 'telefone') newValue = maskTelefone(value);
    setForm({ ...form, [name]: newValue });
    let error = '';
    if (name === 'nome') error = validateNome(newValue);
    if (name === 'email') error = validateEmail(newValue);
    if (name === 'telefone') error = validateTelefone(newValue);
    if (name === 'senha') error = validateSenha(newValue);
    if (name === 'confirmacaoSenha') error = validateConfirmacaoSenha(form.senha, newValue);
    setFieldErrors({ ...fieldErrors, [name]: error });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const nomeError = validateNome(form.nome);
    const emailError = validateEmail(form.email);
    const telefoneError = validateTelefone(form.telefone);
    const senhaError = validateSenha(form.senha);
    const confirmacaoSenhaError = validateConfirmacaoSenha(form.senha, form.confirmacaoSenha);
    const errors = {
      nome: nomeError,
      email: emailError,
      telefone: telefoneError,
      senha: senhaError,
      confirmacaoSenha: confirmacaoSenhaError,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      setError('Por favor, corrija os campos destacados.');
      return;
    }
    // Converter CadastroFormData para RegisterData
    const registerData = {
      name: form.nome,
      email: form.email,
      password: form.senha,
      phone: form.telefone,
      role_id: form.role as RoleType,
      cidade_id: form.cidade,
      estado_id: form.estado,
    };
    setLoading(true);
    try {
      await register(registerData);
      setSuccess('Cadastro realizado com sucesso!');
    } catch (err: unknown) {
      // Tratamento específico de erros da API
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { 
          response?: { 
            data?: { 
              detail?: string | Array<{ msg: string; loc: string[] }>
            }; 
            status?: number 
          } 
        };
        const detail = axiosError.response?.data?.detail;
        const status = axiosError.response?.status;
        
        if (status === 409) {
          // Conflito - E-mail já cadastrado
          setError(typeof detail === 'string' ? detail : 'E-mail já cadastrado.');
        } else if (status === 422) {
          // Erro de validação do Pydantic
          if (Array.isArray(detail)) {
            // Múltiplos erros de validação
            const errorMessages = detail.map(err => err.msg).join('; ');
            setError(errorMessages || 'Dados inválidos. Verifique os campos e tente novamente.');
          } else {
            setError(typeof detail === 'string' ? detail : 'Dados inválidos. Verifique os campos e tente novamente.');
          }
        } else if (status === 400) {
          // Requisição inválida
          setError(typeof detail === 'string' ? detail : 'Requisição inválida. Verifique os dados e tente novamente.');
        } else if (typeof detail === 'string') {
          setError(detail);
        } else {
          setError('Erro ao cadastrar. Tente novamente.');
        }
      } else {
        setError('Erro ao cadastrar. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
        error={!!fieldErrors.nome}
        helperText={fieldErrors.nome}
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
        error={!!fieldErrors.email}
        helperText={fieldErrors.email}
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
        error={!!fieldErrors.telefone}
        helperText={fieldErrors.telefone}
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
        error={!!fieldErrors.senha}
        helperText={fieldErrors.senha}
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
        error={!!fieldErrors.confirmacaoSenha}
        helperText={fieldErrors.confirmacaoSenha}
      />
      <TextField
        select
        label="Tipo de usuário"
        name="role"
        value={form.role}
        onChange={handleChange}
        required
        fullWidth
        disabled={loadingRoles}
        helperText={loadingRoles ? 'Carregando tipos de usuário...' : ''}
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
  );
}
