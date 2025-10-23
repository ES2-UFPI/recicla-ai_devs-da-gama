import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.ts';
import type { AuthContextType } from '../types/auth';

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth deve ser usado dentro de um AuthProvider');
	}
	return context as AuthContextType;
}
