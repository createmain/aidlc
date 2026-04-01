import { Card, CardMedia, CardContent, Typography, CardActionArea } from '@mui/material';
import type { MenuItem } from '../../../types';

const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE_URL || '/uploads';

interface Props {
  menu: MenuItem;
  onClick: () => void;
}

export default function MenuCard({ menu, onClick }: Props) {
  return (
    <Card sx={{ minHeight: 44 }} data-testid={`menu-card-${menu.id}`}>
      <CardActionArea onClick={onClick} sx={{ minHeight: 44, minWidth: 44 }}>
        <CardMedia
          component="img"
          height="140"
          image={menu.imagePath ? `${UPLOADS_BASE}/${menu.imagePath}` : '/placeholder-food.png'}
          alt={menu.name}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent>
          <Typography variant="subtitle1" noWrap>{menu.name}</Typography>
          <Typography variant="body2" color="primary" fontWeight="bold">
            {menu.price.toLocaleString()}원
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
