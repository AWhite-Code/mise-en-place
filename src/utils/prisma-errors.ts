export function isPrismaError(error: unknown, code: string): boolean {
    return (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === code
    );
}