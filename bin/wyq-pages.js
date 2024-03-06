#!/usr/bin/env node

// process.argv // 数组 根据数组信息，在手动添加命令,替代了手工添加 

process.argv.push('--cwd')
process.argv.push(process.cwd()) // 工作目录
process.argv.push('--gulpfile') // 指定 gulpfile 地址
process.argv.push(require.resolve('..'))

require('gulp/bin/gulp');// 会执行 gulp-cli 执行 gulpfile.js  读取 pages.config.js 覆盖路径
