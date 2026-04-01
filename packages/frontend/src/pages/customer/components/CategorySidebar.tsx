import { List, ListItemButton, ListItemText, Box } from '@mui/material';
import type { Category } from '../../../types';

interface Props {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export default function CategorySidebar({ categories, selectedId, onSelect }: Props) {
  return (
    <Box sx={{ width: 160, borderRight: 1, borderColor: 'divider', overflowY: 'auto', bgcolor: 'grey.50' }}>
      <List disablePadding>
        <ListItemButton
          selected={selectedId === null}
          onClick={() => onSelect(null)}
          sx={{ minHeight: 48 }}
          data-testid="category-all"
        >
          <ListItemText primary="전체" />
        </ListItemButton>
        {categories.map(cat => (
          <ListItemButton
            key={cat.id}
            selected={selectedId === cat.id}
            onClick={() => onSelect(cat.id)}
            sx={{ minHeight: 48 }}
            data-testid={`category-${cat.id}`}
          >
            <ListItemText primary={cat.name} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
