
import { AuthLayout } from '../../layouts/AuthLayout';
import { CadastroForm } from './components/CadastroForm';

export default function Cadastro() {
  return (
    <AuthLayout title="Criar conta no ReciclaAi" subtitle="Preencha os dados para se cadastrar">
      <CadastroForm />
    </AuthLayout>
  );
}
