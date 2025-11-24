import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { UserTypeSelector } from './components/UserTypeSelector';
import { ProdutorForm } from './components/ProdutorForm';
import { ColetorForm } from './components/ColetorForm';
import { ReceptorForm } from './components/ReceptorForm';
import type { BuilderStep, RoleType, ProdutorData, ColetorData, ReceptorData } from './types';
import type { RegisterData } from '../../types/auth';

export default function Cadastro() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState<BuilderStep>('select-type');
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectType = (type: RoleType) => {
    setSelectedRole(type);
    setCurrentStep('form');
  };

  const handleBack = () => {
    setSelectedRole(null);
    setCurrentStep('select-type');
    setError(null);
  };

  const handleSubmit = async (data: ProdutorData | ColetorData | ReceptorData) => {
    setLoading(true);
    setError(null);

    try {
      // Converter para RegisterData (formato esperado pela API)
      const registerData: RegisterData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role_id: data.role_id,
        cidade_id: data.cidade_id,
        estado_id: data.estado_id,
      };

      // Adicionar campos específicos de cada role
      if (data.role_id === 'produtor') {
        const produtorData = data as ProdutorData;
        registerData.addresses = produtorData.addresses;
        registerData.is_business = produtorData.is_business;
        if (produtorData.cnpj) registerData.cnpj = produtorData.cnpj;
        registerData.points = produtorData.points;
        registerData.ranking = produtorData.ranking;
      } else if (data.role_id === 'coletor') {
        const coletorData = data as ColetorData;
        registerData.inventory = coletorData.inventory;
        if (coletorData.addresses) registerData.addresses = coletorData.addresses;
      } else if (data.role_id === 'receptor') {
        const receptorData = data as ReceptorData;
        registerData.addresses = receptorData.addresses;
        registerData.accepted_material = receptorData.accepted_material;
      }

      await register(registerData);
      
      // Redirecionar após sucesso
      navigate('/');
    } catch (err: unknown) {
      // Tratamento de erros
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
          setError('E-mail já cadastrado. Tente fazer login ou use outro e-mail.');
        } else if (status === 422) {
          if (Array.isArray(detail)) {
            const errorMessages = detail.map(err => err.msg).join('; ');
            setError(errorMessages || 'Dados inválidos. Verifique os campos e tente novamente.');
          } else {
            setError(typeof detail === 'string' ? detail : 'Dados inválidos. Verifique os campos e tente novamente.');
          }
        } else if (status === 400) {
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: currentStep === 'select-type' ? 900 : 700 }}>
        {currentStep === 'select-type' && (
          <UserTypeSelector onSelectType={handleSelectType} />
        )}

        {currentStep === 'form' && selectedRole === 'produtor' && (
          <ProdutorForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            onBack={handleBack}
          />
        )}

        {currentStep === 'form' && selectedRole === 'coletor' && (
          <ColetorForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            onBack={handleBack}
          />
        )}

        {currentStep === 'form' && selectedRole === 'receptor' && (
          <ReceptorForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            onBack={handleBack}
          />
        )}
      </Box>
    </Box>
  );
}
