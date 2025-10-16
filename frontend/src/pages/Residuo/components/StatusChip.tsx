import { Chip } from '@mui/material';
import type { ResiduoStatus } from '../../../types/residuo';
import { statusColor } from '../constants';

export const StatusChip = ({ s }: { s: ResiduoStatus }) => (
  <Chip size="small" label={s} color={statusColor[s]} variant={s === ('CRIADO' as ResiduoStatus) ? 'outlined' : 'filled'} />
);
