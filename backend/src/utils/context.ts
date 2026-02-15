import { v4 as uuidv4 } from 'uuid';

export interface RequestContext {
  requestId: string;
  tenantId?: string;
  userId?: string;
  startTime: number;
}

const requestContextMap = new Map<string, RequestContext>();

export const createRequestContext = (tenantId?: string, userId?: string): string => {
  const requestId = uuidv4();
  requestContextMap.set(requestId, {
    requestId,
    tenantId,
    userId,
    startTime: Date.now(),
  });
  return requestId;
};

export const getRequestContext = (requestId: string): RequestContext | undefined => {
  return requestContextMap.get(requestId);
};

export const deleteRequestContext = (requestId: string): void => {
  requestContextMap.delete(requestId);
};

export const updateRequestContext = (
  requestId: string,
  updates: Partial<Omit<RequestContext, 'requestId' | 'startTime'>>
): void => {
  const context = requestContextMap.get(requestId);
  if (context) {
    requestContextMap.set(requestId, { ...context, ...updates });
  }
};
