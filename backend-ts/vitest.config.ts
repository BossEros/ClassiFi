import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            all: true,
            include: [
                'src/modules/auth/auth.service.ts',
                'src/modules/auth/auth.schema.ts',
                'src/modules/classes/class.schema.ts',
                'src/modules/classes/class-code.util.ts',
                'src/modules/assignments/assignment.schema.ts',
                'src/modules/notifications/notification.schema.ts',
                'src/modules/notifications/notification-preference.schema.ts',
                'src/modules/notifications/notification-preference.service.ts',
                'src/modules/submissions/submission.schema.ts',
                'src/modules/users/user.service.ts',
            ],
            thresholds: {
                lines: 100,
                functions: 100,
                branches: 100,
                statements: 100,
                perFile: true,
            },
            exclude: [
                'node_modules/**',
                'dist/**',
                '**/*.test.ts',
                '**/index.ts',
            ],
        },
        setupFiles: ['./tests/setup.ts'],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
