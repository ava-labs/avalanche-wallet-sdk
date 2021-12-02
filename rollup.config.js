import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import del from 'rollup-plugin-delete';
import ttypescript from 'ttypescript';
import typescript from 'rollup-plugin-typescript2';

export default {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'cjs',
        sourcemap: process.env.BUILD === 'production' ? false : true,
    },
    plugins: [
        del({ targets: 'dist/*' }),
        typescript({
            typescript: ttypescript,
            tsconfig: 'tsconfig.json',
            tsconfigOverride: {
                exclude: ['./test/**'],
                compilerOptions: {
                    rootDir: './src',
                },
            },
        }),
        json(),
        commonjs(),
    ],
};
