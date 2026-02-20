import prisma from './prisma';

// Action types
export type ActionType = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD' | 'DOWNLOAD';

// Resource types
export type ResourceType =
  | 'AUTH'
  | 'SETUP_PROJECT'
  | 'CEST_PROJECT'
  | 'DOCUMENT'
  | 'CALENDAR_EVENT'
  | 'MAP_PIN'
  | 'ARCHIVAL_RECORD'
  | 'USER'
  | 'USER_PERMISSION';

export interface LogActivityParams {
  userId: string;
  action: ActionType;
  resourceType: ResourceType;
  resourceId?: string;
  resourceTitle?: string;
  details?: Record<string, unknown>;
}

export async function logActivity({
  userId,
  action,
  resourceType,
  resourceId,
  resourceTitle,
  details,
}: LogActivityParams): Promise<void> {
  console.log('[Activity Log] Attempting to log:', { userId, action, resourceType, resourceId, resourceTitle });

  if (!userId) {
    console.warn('[Activity Log] No userId provided, skipping log');
    return;
  }

  try {
    const log = await prisma.userLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        resourceTitle,
        details: details ? JSON.stringify(details) : null,
      },
    });
    console.log('[Activity Log] Successfully logged activity:', log.id);
  } catch (error) {
    // Log error but don't throw - activity logging should not break the main operation
    console.error('[Activity Log] Failed to log activity:', error);
  }
}

// Helper to extract userId from request headers
export function getUserIdFromRequest(req: Request): string | null {
  return req.headers.get('x-user-id');
}
