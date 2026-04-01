import { Component, type ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh" gap={2}>
          <Typography variant="h6">오류가 발생했습니다</Typography>
          <Button variant="contained" onClick={() => this.setState({ hasError: false })} data-testid="error-retry-button">
            다시 시도
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
