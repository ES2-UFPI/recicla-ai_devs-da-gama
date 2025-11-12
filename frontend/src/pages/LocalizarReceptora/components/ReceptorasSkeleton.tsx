import { Box, Card, CardContent, Skeleton } from '@mui/material';

export function ReceptorasSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="70%" height={32} />
                <Skeleton variant="text" width="90%" height={20} />
              </Box>
              <Skeleton variant="rounded" width={60} height={24} />
            </Box>

            {/* Endereço */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Skeleton variant="circular" width={20} height={20} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="85%" />
                <Skeleton variant="text" width="60%" />
              </Box>
            </Box>

            {/* Horário */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width="50%" />
            </Box>

            {/* Telefone */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width="40%" />
            </Box>

            {/* Chips */}
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Skeleton variant="rounded" width={70} height={24} />
              <Skeleton variant="rounded" width={60} height={24} />
              <Skeleton variant="rounded" width={80} height={24} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
