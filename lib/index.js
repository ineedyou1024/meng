const { src, dest, parallel, series, watch } = require('gulp')
const del = require('del')
// gulp-load-plugins 自带一些gulp-babel等以gulp开头的插件，
// 这样就可以下载一次一步到位,这里的gulp-sass例外
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
const sass = require('gulp-sass')(require('sass'))
const browserSync = require('browser-sync')
const bs = browserSync.create()
const cwd = process.cwd() //当前工作目录
let confg = {
    // 默认的配置
    build:{
        src:'src',
        dist:'dist',
        temp:'temp',
        public:'public',
        paths:{
            styles:'assets/styles/*.scss',
            scripts:'assets/scripts/*.js',
            pages:'*.html',
            images:'assets/images/**',
            fonts:'assets/fonts/**'
        }
    }
}
try {
    const loadConfg = require(`${cwd}/pages.config.js`)
    confg = Object.assign({},confg,loadConfg) 
} catch (error) {
    
}
const style = () => {
  return src(confg.build.paths.styles, { base: confg.build.src ,cwd:confg.build.src})
    // .pipe(sass({outputStyle:'expanded'}))  // 末尾的}放在空行里
    .pipe(sass())
    .pipe(dest(confg.build.temp))
    .pipe(bs.reload({ stream: true })) // 热更新，这个和下面的file选其一
}
// {presets:['@babel/preset-env']} 转换所有的新特性 也可以配置在babelrc文件里
const script = () => {
  return src(confg.build.paths.scripts, { base: confg.build.src ,cwd:confg.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(confg.build.temp))
    .pipe(bs.reload({ stream: true }))
}
// html模板
const page = () => {
  return src(confg.build.paths.pages, { base: confg.build.src,cwd:confg.build.src })
    .pipe(plugins.swig({data:confg.data })) // 把些特定的名称写入模板
    .pipe(dest(confg.build.temp))
    .pipe(bs.reload({ stream: true }))
}
// 图片
// image font  extra不需要写入中间的temp目录
const image = () => {
  return src(confg.build.paths.images, { base: confg.build.src,cwd:confg.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(confg.build.dist))
}
// 字体
const font = () => {
  return src(confg.build.paths.fonts, { base: confg.build.src,cwd:confg.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(confg.build.dist))
}
// 其他文件
const extra = () => {
  return src('**', { base: confg.build.public,cwd:confg.build.public })
    .pipe(dest(confg.build.dist))
}
// 清除 temp是个临时目录
const clean = () => {
  return del([confg.build.dist, confg.build.temp])
}
// 服务器  如果routes配置有先走routes,没有就走baseDir
// 对于图片文件和字体文件开发阶段不参与编译，文件的查找按baseDir里的顺序找
const serve = () => {
  watch(confg.build.paths.styles, {cwd:confg.build.src}, style)
  watch(confg.build.paths.scripts, {cwd:confg.build.src}, script)
  watch(confg.build.paths.pages, {cwd:confg.build.src}, page)
  // watch('src/assets/images/**',image)
  // watch('src/assets/fonts/**',font)
  // watch('public/**',extra)
  watch([
    confg.build.paths.images,
    confg.build.paths.fonts,
  ], {cwd:confg.build.src}, bs.reload)
  watch('**', {cwd:confg.build.public}, bs.reload)
  bs.init({
    notify: false,
    port: 2080, // 端口
    // open:false,  //自动打开浏览器
    // files:"dist/**",  // 热更新
    server: {
      routes: {
        '/node_modules': 'node_modules'
      },
      baseDir: [confg.build.temp, confg.build.src, confg.build.public]
    }
  })
}
// 因为在temp里面读文件了，再写入dist
const useref = () => {
  return src(confg.build.paths.pages, { base: confg.build.temp, cwd:confg.build.temp })
    .pipe(plugins.useref({ searchPath: [confg.build.temp, '.'] }))
    // html js css
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    }))) // 压缩行字符
    .pipe(dest(confg.build.dist))
}
// 任务混合执行（各个任务没有并行）
// compile开发阶段下的子任务
const compile = parallel(style, script, page)
// 上线之前执行的任务  先清除
const build = series(clean, parallel(series(compile, useref), extra, image, font))
// 开发阶段
const develop = series(compile, serve)
module.exports = {
  // compile,
  build,
  clean,
  // serve, 不单独使用，因为它依赖compile
  develop
  // useref 不需单独导出
}
