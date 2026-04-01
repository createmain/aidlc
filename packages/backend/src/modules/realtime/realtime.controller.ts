import { Response, NextFunction } from 'express';
import { realtimeService } from './realtime.service';
import { AuthRequest, TableTokenPayload } from '../../types';

export const realtimeController = {
  subscribe(req: AuthRequest, res: Response, _next: NextFunction): void {
    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // nginx 버퍼링 비활성화
    res.flushHeaders();

    const clientId = realtimeService.addClient(res);

    // 연결 종료 시 클라이언트 제거
    req.on('close', () => {
      realtimeService.removeClient(clientId);
    });
  },

  subscribeCustomer(req: AuthRequest, res: Response, _next: NextFunction): void {
    const user = req.user as TableTokenPayload;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const clientId = realtimeService.addTableClient(user.tableId, res);

    req.on('close', () => {
      realtimeService.removeTableClient(clientId);
    });
  },
};
