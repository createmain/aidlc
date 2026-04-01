import { CircularProgress, Box } from '@mui/material';

interface Props {
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
}

const sizeMap = { small: 24, medium: 40, large: 56 };

export default function LoadingSpinner({ size = 'medium', fullPage = false }: Props) {
  if (fullPage) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={sizeMap[size]} data-testid="loading-spinner" />
      </Box>
    );
  }
  return (
    <Box display="flex" justifyContent="center" p={3}>
      <CircularProgress size={sizeMap[size]} data-testid="loading-spinner" />
    </Box>
  );
}
