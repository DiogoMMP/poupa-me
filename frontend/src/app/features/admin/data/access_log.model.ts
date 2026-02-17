export interface PagedResult<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface AccessLogItem {
  id: number;
  timestamp: string; // ISO
  userName: string;
  role: string;
  method: string;
  path: string;
  statusCode: number;
  remoteIp: string | null;
}

export {};
