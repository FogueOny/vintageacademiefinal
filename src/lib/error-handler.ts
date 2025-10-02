import { toast } from 'sonner';

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

const isSupabaseErrorLike = (error: unknown): error is SupabaseErrorLike =>
  typeof error === 'object' && error !== null && ('code' in error || 'message' in error);

export function handleSupabaseError(error: unknown, context?: string): AppError {
  const contextMsg = context ? `[${context}] ` : '';

  if (isSupabaseErrorLike(error) && error.code === 'PGRST116') {
    return new AppError(`${contextMsg}Aucun résultat trouvé`, 'NOT_FOUND', 404);
  }

  if (isSupabaseErrorLike(error) && error.code === '23505') {
    return new AppError(`${contextMsg}Cette donnée existe déjà`, 'DUPLICATE_ENTRY', 409);
  }

  if (isSupabaseErrorLike(error) && error.code === '42501') {
    return new AppError(`${contextMsg}Permissions insuffisantes`, 'PERMISSION_DENIED', 403);
  }

  if (
    isSupabaseErrorLike(error) &&
    typeof error.message === 'string' &&
    error.message.includes('JWT')
  ) {
    return new AppError(`${contextMsg}Session expirée, veuillez vous reconnecter`, 'AUTH_ERROR', 401);
  }

  const message = isSupabaseErrorLike(error) && typeof error.message === 'string'
    ? error.message
    : 'Erreur inconnue';
  const code = isSupabaseErrorLike(error) && typeof error.code === 'string'
    ? error.code
    : 'SUPABASE_ERROR';

  return new AppError(
    `${contextMsg}${message}`,
    code,
    500
  );
}

export function logError(error: Error | AppError, context?: string) {
  const timestamp = new Date().toISOString();
  const contextMsg = context ? `[${context}] ` : '';
  
  console.error(`${timestamp} ${contextMsg}${error.message}`, {
    name: error.name,
    code: error instanceof AppError ? error.code : 'UNKNOWN',
    stack: error.stack,
  });
}

export function showErrorToast(error: Error | AppError, fallbackMessage?: string) {
  const message = error.message || fallbackMessage || 'Une erreur est survenue';
  toast.error(message);
}

export function createApiResponse<T>(
  data: T | null, 
  error: Error | null = null
): { data: T | null; error: ApiError | null; success: boolean } {
  if (error) {
    const appError = error instanceof AppError ? error : handleSupabaseError(error);
    return {
      data: null,
      error: {
        message: appError.message,
        code: appError.code,
        details: error,
      },
      success: false
    };
  }
  
  return {
    data,
    error: null,
    success: true
  };
} 