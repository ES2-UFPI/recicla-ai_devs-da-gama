import { useState, useEffect } from 'react';
import { TextField, MenuItem, Stack, CircularProgress } from '@mui/material';
import { maskTelefone } from '../mask';
import {
  validateNome,
  validateEmail,
  validateTelefone,
  validateSenha,
  validateConfirmacaoSenha,
} from '../validation';

interface BaseUserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmacaoSenha: string;
  cidade_id: string;
  estado_id: string;
}

interface BaseUserFormProps {
  formData: BaseUserFormData;
  onChange: (data: Partial<BaseUserFormData>) => void;
  fieldErrors: Partial<Record<keyof BaseUserFormData, string>>;
  onFieldError: (field: keyof BaseUserFormData, error: string) => void;
}

interface Estado {
  sigla: string;
  nome: string;
}

interface Cidade {
  nome: string;
}

export function BaseUserForm({ 
  formData, 
  onChange, 
  fieldErrors,
  onFieldError 
}: BaseUserFormProps) {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [loadingEstados, setLoadingEstados] = useState(true);
  const [loadingCidades, setLoadingCidades] = useState(false);

  useEffect(() => {
    setLoadingEstados(true);
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then((data: Estado[]) => {
        setEstados(data.map(uf => ({ sigla: uf.sigla, nome: uf.nome })));
        setLoadingEstados(false);
      })
      .catch(() => setLoadingEstados(false));
  }, []);

  useEffect(() => {
    if (!formData.estado_id) {
      setCidades([]);
      return;
    }
    setLoadingCidades(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.estado_id}/municipios`)
      .then(res => res.json())
      .then((data: Cidade[]) => {
        setCidades(data.map(cidade => ({ nome: cidade.nome })));
        setLoadingCidades(false);
      })
      .catch(() => setLoadingCidades(false));
  }, [formData.estado_id]);

  const handleChange = (field: keyof BaseUserFormData, value: string) => {
    let newValue = value;
    
    // Aplicar máscaras e validações
    if (field === 'name') {
      newValue = value.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
      onFieldError(field, validateNome(newValue));
    } else if (field === 'phone') {
      newValue = maskTelefone(value);
      onFieldError(field, validateTelefone(newValue));
    } else if (field === 'email') {
      onFieldError(field, validateEmail(value));
    } else if (field === 'password') {
      onFieldError(field, validateSenha(value));
      // Revalidar confirmação quando a senha mudar
      if (formData.confirmacaoSenha) {
        onFieldError('confirmacaoSenha', validateConfirmacaoSenha(value, formData.confirmacaoSenha));
      }
    } else if (field === 'confirmacaoSenha') {
      onFieldError(field, validateConfirmacaoSenha(formData.password, value));
    }

    onChange({ [field]: newValue });
  };

  return (
    <Stack spacing={2.5}>
      <TextField
        label="Nome completo"
        name="name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        required
        fullWidth
        autoComplete="name"
        error={!!fieldErrors.name}
        helperText={fieldErrors.name}
        placeholder="Digite seu nome completo"
      />

      <TextField
        label="E-mail"
        name="email"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        required
        fullWidth
        autoComplete="email"
        error={!!fieldErrors.email}
        helperText={fieldErrors.email}
        placeholder="seu@email.com"
      />

      <TextField
        label="Telefone"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        required
        fullWidth
        autoComplete="tel"
        error={!!fieldErrors.phone}
        helperText={fieldErrors.phone}
        placeholder="(00) 00000-0000"
      />

      <TextField
        label="Senha"
        name="password"
        type="password"
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        required
        fullWidth
        autoComplete="new-password"
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || 'Mínimo 8 caracteres, 1 maiúscula, 1 número e 1 caractere especial'}
      />

      <TextField
        label="Confirmação de senha"
        name="confirmacaoSenha"
        type="password"
        value={formData.confirmacaoSenha}
        onChange={(e) => handleChange('confirmacaoSenha', e.target.value)}
        required
        fullWidth
        autoComplete="new-password"
        error={!!fieldErrors.confirmacaoSenha}
        helperText={fieldErrors.confirmacaoSenha}
      />

      <TextField
        select
        label="Estado"
        name="estado_id"
        value={formData.estado_id}
        onChange={(e) => {
          onChange({ estado_id: e.target.value, cidade_id: '' });
        }}
        required
        fullWidth
        disabled={loadingEstados}
        helperText={loadingEstados ? 'Carregando estados...' : ''}
        InputProps={{
          endAdornment: loadingEstados && <CircularProgress size={20} />,
        }}
      >
        {estados.map((uf) => (
          <MenuItem key={uf.sigla} value={uf.sigla}>
            {uf.nome} ({uf.sigla})
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Cidade"
        name="cidade_id"
        value={formData.cidade_id}
        onChange={(e) => onChange({ cidade_id: e.target.value })}
        required
        fullWidth
        disabled={!formData.estado_id || loadingCidades}
        helperText={
          !formData.estado_id 
            ? 'Selecione um estado primeiro' 
            : loadingCidades 
            ? 'Carregando cidades...' 
            : ''
        }
        InputProps={{
          endAdornment: loadingCidades && <CircularProgress size={20} />,
        }}
      >
        {cidades.map((cidade) => (
          <MenuItem key={cidade.nome} value={cidade.nome}>
            {cidade.nome}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
