import { type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface Props {
  message: string;
  icon?: ReactNode;
}

export default function EmptyState({ message, icon }: Props) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} gap={1} color="text.secondary">
      {icon || <InboxIcon sx={{ fontSize: 48 }} />}
      <Typography variant="body1">{message}</Typography>
    </Box>
  );
}
