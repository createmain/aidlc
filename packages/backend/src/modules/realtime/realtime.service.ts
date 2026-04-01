import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../config/logger';

interface SSEClient {
  id: string;
  res: Response;
  tableId?: number; // 고객 클라이언트용
}

const adminClients = new Map<string, SSEClient>();
const tableClients = new Map<string, SSEClient>();

export const realtimeService = {
  addClient(res: Response): string {
    const clientId = uuidv4();
    adminClients.set(clientId, { id: clientId, res });
    logger.info({ clientId }, 'Admin SSE client connected');
    return clientId;
  },

  removeClient(clientId: string): void {
    adminClients.delete(clientId);
    logger.info({ clientId }, 'Admin SSE client disconnected');
  },

  addTableClient(tableId: number, res: Response): string {
    const clientId = `table-${tableId}`;
    tableClients.set(clientId, { id: clientId, res, tableId });
    logger.info({ clientId, tableId }, 'Table SSE client connected');
    return clientId;
  },

  removeTableClient(clientId: string): void {
    tableClients.delete(clientId);
    logger.info({ clientId }, 'Table SSE client disconnected');
  },

  broadcast(event: string, data: unknown): void {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [, client] of adminClients) {
      try {
        client.res.write(message);
      } catch {
        adminClients.delete(client.id);
      }
    }
    logger.debug({ event, clientCount: adminClients.size }, 'Broadcast to admin clients');
  },

  sendToTable(tableId: number, event: string, data: unknown): void {
    const clientId = `table-${tableId}`;
    const client = tableClients.get(clientId);
    if (client) {
      try {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        client.res.write(message);
      } catch {
        tableClients.delete(clientId);
      }
    }
  },
};
