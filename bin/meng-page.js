#!/usr/bin/env node

process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
console.log('122336');
process.argv.push(require.resolve('..'))

require('gulp/bin/gulp')
