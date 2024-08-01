
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [...configDefaults.include, 'tests/*.{js,cjs,ts}'],
    coverage: {
      provider: 'v8',
      include: [
        'src/**',
      ],
      exclude: [
        'src/index.ts',
        'src/command.ts',
      ],
      reporter: [
        'text',
        'text-summary',
        'lcov',
      ],
      extension: [
        '.ts',
      ],
      all: true,
    },
  },
});
