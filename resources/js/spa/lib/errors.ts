import { ApiError } from '@/spa/lib/api';

export function toErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Something went wrong. Please try again.';
}

export function getFieldError(
    error: unknown,
    field: string,
): string | undefined {
    if (error instanceof ApiError && error.errors !== undefined) {
        const messages = error.errors[field];

        if (messages !== undefined && messages.length > 0) {
            return messages[0];
        }
    }

    return undefined;
}

export function extractFieldErrors(error: unknown): Record<string, string[]> {
    if (error instanceof ApiError && error.errors !== undefined) {
        return error.errors;
    }

    return {};
}
