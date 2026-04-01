import { useState } from 'react';
import { Box, Button, IconButton, Typography, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { menusApi } from '../../../api/menus';
import { useToast } from '../../../contexts/ToastContext';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import type { MenuItem } from '../../../types';

interface Props {
  menus: MenuItem[];
  onEdit: (menu: MenuItem) => void;
  onCreate: () => void;
  onUpdate: () => void;
}

function SortableRow({ menu, onEdit, onDelete }: { menu: MenuItem; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: menu.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <TableRow ref={setNodeRef} style={style} data-testid={`menu-row-${menu.id}`}>
      <TableCell><IconButton {...attributes} {...listeners} size="small"><DragIndicatorIcon /></IconButton></TableCell>
      <TableCell>{menu.name}</TableCell>
      <TableCell>{menu.price.toLocaleString()}원</TableCell>
      <TableCell>{menu.categoryName}</TableCell>
      <TableCell>
        <IconButton size="small" onClick={onEdit} data-testid={`menu-edit-${menu.id}`}><EditIcon /></IconButton>
        <IconButton size="small" color="error" onClick={onDelete} data-testid={`menu-delete-${menu.id}`}><DeleteIcon /></IconButton>
      </TableCell>
    </TableRow>
  );
}

export default function MenuList({ menus, onEdit, onCreate, onUpdate }: Props) {
  const [items, setItems] = useState(menus);
  const [orderChanged, setOrderChanged] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { showToast } = useToast();

  useState(() => { setItems(menus); });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    setItems(arrayMove(items, oldIndex, newIndex));
    setOrderChanged(true);
  };

  const handleSaveOrder = async () => {
    try {
      const orders = items.map((item, idx) => ({ id: item.id, displayOrder: (idx + 1) * 100 }));
      await menusApi.updateOrder(orders);
      showToast('success', '순서가 저장되었습니다');
      setOrderChanged(false);
      onUpdate();
    } catch {
      showToast('error', '순서 저장 실패');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await menusApi.delete(deleteId);
      showToast('success', '메뉴가 삭제되었습니다');
      setDeleteId(null);
      onUpdate();
    } catch (err: unknown) {
      showToast('error', (err as { message?: string }).message || '삭제 실패');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">메뉴 목록</Typography>
        <Box display="flex" gap={1}>
          {orderChanged && <Button variant="outlined" onClick={handleSaveOrder} data-testid="menu-save-order">순서 저장</Button>}
          <Button variant="contained" onClick={onCreate} data-testid="menu-create-button">메뉴 등록</Button>
        </Box>
      </Box>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <Table data-testid="menu-list-table">
            <TableHead>
              <TableRow>
                <TableCell width={50}></TableCell>
                <TableCell>메뉴명</TableCell>
                <TableCell>가격</TableCell>
                <TableCell>카테고리</TableCell>
                <TableCell width={100}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(menu => (
                <SortableRow key={menu.id} menu={menu} onEdit={() => onEdit(menu)} onDelete={() => setDeleteId(menu.id)} />
              ))}
            </TableBody>
          </Table>
        </SortableContext>
      </DndContext>
      <ConfirmDialog open={!!deleteId} title="메뉴 삭제" message="이 메뉴를 삭제하시겠습니까?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
