import { createAdminClient } from '@/lib/supabase/admin'

type LogLevel = 'info' | 'warn' | 'error' | 'fatal'

interface LogContext {
    userId?: string
    path?: string
    [key: string]: any
}

export class Logger {
    private static async writeToDb(level: LogLevel, message: string, stack?: string, context?: LogContext, source: 'client' | 'server' = 'server') {
        // Safe check for environment
        if (typeof window !== 'undefined' && source === 'server') {
            // If called from client code but pretending to be server, redirect to API
            return this.logClient(level, message, stack, context)
        }

        try {
            const adminDb = createAdminClient()

            const { error } = await adminDb.from('error_logs').insert({
                level,
                message,
                stack,
                context,
                user_id: context?.userId,
                source
            })

            if (error) {
                // Fallback to console if DB fails
                console.error('Logger Failed to Write to DB:', error)
                console.error('Original Error:', { message, stack, context })
            }
        } catch (e) {
            console.error('Logger System Error:', e)
            console.error('Original Error:', { message, stack, context })
        }
    }

    private static async logClient(level: LogLevel, message: string, stack?: string, context?: LogContext) {
        try {
            await fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level, message, stack, context })
            })
        } catch (e) {
            console.error('Failed to send log to server:', e)
        }
    }

    static async info(message: string, context?: LogContext) {
        if (typeof window === 'undefined') {
            await this.writeToDb('info', message, undefined, context)
        } else {
            await this.logClient('info', message, undefined, context)
        }
    }

    static async warn(message: string, context?: LogContext) {
        if (typeof window === 'undefined') {
            await this.writeToDb('warn', message, undefined, context)
        } else {
            await this.logClient('warn', message, undefined, context)
        }
    }

    static async error(message: string, error?: any, context?: LogContext) {
        const stack = error?.stack || (error instanceof Error ? error.stack : undefined)
        const msg = message + (error?.message ? `: ${error.message}` : '')

        // Always log to console in dev or for immediate visibility
        if (process.env.NODE_ENV === 'development') {
            console.error('[Logger]', msg, context, error)
        }

        if (typeof window === 'undefined') {
            await this.writeToDb('error', msg, stack, context)
        } else {
            await this.logClient('error', msg, stack, context)
        }
    }
}
