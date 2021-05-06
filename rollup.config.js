import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import del from 'rollup-plugin-delete';

export default {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'cjs',
        sourcemap: process.env.BUILD === 'production' ? false : true,
    },
    plugins: [del({ targets: 'dist/*' }), typescript({ exclude: ['./test/**'], rootDir: './src' }), json()],
};
