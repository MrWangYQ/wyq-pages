#!/usr/bin/env node

// process.argv // 数组 根据数组信息，在手动添加命令

process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..'))

require('gulp/bin/gulp');
