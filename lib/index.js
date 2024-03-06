const { src, dest, parallel, series, watch } = require('gulp');
// src { base: '基准路径' }
// dest: destination 目的地
// dist: distribution 分布

const del = require('del');
// 返回的是 promise
const broswerSync = require('browser-sync')
const bs = broswerSync.create() // 创建开发服务器
// 不是 gulp 的插件，只是用 gulp 来 管理
// 自动调起浏览器预览

const cwd = process.cwd(); // 当前工作目录
let config = {
    // default config
    build: {
        src: 'src', // 目的：把项目中 src、temp 这些固定路径配置灵活。后期通过 pages.config.js 去覆盖
        dist: 'dist',
        temp: 'temp',
        public: 'public',
        paths: {
            styles: 'assets/styles/*.scss',
            scripts: 'assets/scripts/*.js',
            pages: '*.html',
            images: 'assets/images/**',
            fonts: 'assets/fonts/**'
        }
    }
}; // 尝试读取目录下的 pages.config.js 文件
try {
    const loadConfig = require(`${cwd}/pages.config.js`)
    config = Object.assign({}, config, loadConfig)
} catch (error) {
    
}

const sass = require('gulp-sass')(require('sass')); 
// gulp-sass不再有默认的sass编译器；请自己设置一个。
// 压缩 scss 文件

// const babel = require('gulp-babel');
// 安装了 gulp-babel 不会自动帮你安装核心转换模块需要自己手动安装
// 还需要安装 @babel/core() @babel/preset-env(ECMAScript 新特性) 
// 压缩 js 文件

// const swig = require('gulp-swig');
// 压缩 html 文件

const imagemin = require('gulp-imagemin');
// 内部依赖的模块也是 c++，涉及到的 c++模块，都需要下载二进制的程序集
// 压缩 image 文件

// const gulpSwig = require('gulp-swig');
// // 压缩 html 文件

// gulp-load-plugins 会自动加载插件，把插件的当作 plugins下的一个属性
// 如果修改名称：  gulp-sass => plugins.sass  gulp-babel-es => plugins.babelEs
// 即 plugins.sass plugins.swig
const loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins()
// 因为 gulp-sass 需要手动添加依赖，所以没办法使用 plugins 加载


// 此处为了测试，实际应该写成 json 文件，在导入进来，更合理
// const data = {
//     menus: [
//       {
//         name: 'Home',
//         icon: 'aperture',
//         link: 'index.html'
//       },
//       {
//         name: 'Features',
//         link: 'features.html'
//       },
//       {
//         name: 'About',
//         link: 'about.html'
//       },
//       {
//         name: 'Contact',
//         link: '#',
//         children: [
//           {
//             name: 'Twitter',
//             link: 'https://twitter.com/w_wyq'
//           },
//           {
//             name: 'About',
//             link: 'https://weibo.com/wyqme'
//           },
//           {
//             name: 'divider'
//           },
//           {
//             name: 'About',
//             link: 'https://github.com/wyq'
//           }
//         ]
//       }
//     ],
//     pkg: require('./package.json'),
//     date: new Date()
// }

// 此处require('./package.json') 是读取不到的，这样写死也是不合理的
// 约定大于配置的方式去解决
// 在项目当中去抽象一个配置文件 pages.config.js(大多数成熟的工作流都是这样配置的，例如vue-cli)，在 gulpfile 中去读取这个配置文件



/**
 * 01 样式编译
 * 02 脚本编译
 * 03 html 编译
 * 04 将以上任务组合起来及图片和文件转换
 * 05 其他文件拷贝及文件清除(del 模块)
 * 06 自动加载插件 (插件使用的多，一个一个写比较麻烦。即用 gulp-load-plugins)
 * 07 热更新开发服务器 HMR (broswer-sync 开发服务器，文件修改之后自动更新到浏览器中)
 * 08 监视变化以及构建优化 (gulp 内置方法 watch) 
 * 09 useref 文件引用处理
 * 10 文件压缩 html(gulp-htmlmin 默认删除行内的空白字符，但是换行符不会) css(gulp-clean-css) js(gulp-uglify) gulp-if(根据流文件判断是哪个执行那个)
 * 11 重新规划构建过程 开发环境、上线环境、基础编译过程
 * 12 如何提取多个项目当中共同的自动化构建过程 把gulpfile + gulp 拆成一个项目。然后用 yarn link 方式软连接进去访问等等
 * 13 包装 Gulp CLI
 */

// gulp 当中不一定非的用 src 执行

const clean = () => {
    return del([config.build.dist, config.build.temp])
}

const style = () => {
    return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src }) // src { base: '基准路径' }
       .pipe(sass({ outputStyle: 'expanded' })) // { outputStyle: 'expanded' } 配置 花括号独占一行
       .pipe(dest(config.build.temp))
       .pipe(bs.reload({ stream: true })) 
}

const script = () => {
    return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src }) // src { base: '基准路径' }
       .pipe(plugins.babel({ presets: [require('@babel/preset-env')] })) // 不加 只是拷贝了一份，没有做任何改动
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true }))
}

const page = () => {
    // src/*.html  src下一级的 html 文件
    // src/**/*.html  src 下 任意子目录的 html 文件
    return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src }) // src { base: '基准路径' }
       .pipe(plugins.swig({ data: config.data })) // 因为 html 中 有模板数据，此刻需要从此加入进去
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true }))
}

const image = () => {
    return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src }) // src { base: '基准路径' }
       .pipe(plugins.imagemin()) // 不加 只是拷贝了一份，没有做任何改动
        .pipe(dest(config.build.dist))

// gulp-imagemin 部分源码
// gulp.task('image', gulp.series((done) =>{
//     gulp.src(app.srcPath + 'image/**/*')
//     .pipe($.plumber())
//     .pipe(gulp.dest(app.devPath + 'image'))
//     .pipe($.imagemin())
//     .pipe(gulp.dest(app.prdPath + 'image'))
//     .pipe($.connect.reload());
//     done();
//     }));
          
}

const font = () => {
    return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src }) // src { base: '基准路径' }
       .pipe(imagemin()) // 不加 只是拷贝了一份，没有做任何改动
        .pipe(dest(config.build.dist))
}

const extra = () => {
    return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}


const serve = () => {
    // 监视文件路径通配符，通知任务编译
    watch(config.build.paths.styles, { cwd: config.build.src }, style);
    watch(config.build.paths.scripts, { cwd: config.build.src }, script);
    // 如果发现为变化，则可能因为 swig模板引擎缓存的机制导致页面不会变化，此时需要额外将 swig 选项中的 cache 设置为 false
    watch(config.build.paths.pages, { cwd: config.build.src }, page); 
    // watch('src/assets/images/**', image);
    // watch('src/assets/fonts/**', font);
    // watch('public/**', extra);
    // 减少 watch 执行 reload 任务
    watch([
        config.build.paths.images,
        config.build.paths.fonts,
    ], { cwd: config.build.src }, bs.reload);

    watch('**', { cwd: config.build.public }, bs.reload); 


    // PS: 对于静态资源，开发阶段无需时刻监控，多余的监控，多余的消耗，即在上线之前，打包压缩即可
    // 
    // 初始化
    bs.init({
        notify: false, // 浏览器唤醒右上角提升的文字
        port: 8008, // 端口
        open: false, // 自动唤醒 浏览器
        // files: 'dist/**', // 启动之后的一个路径通配符，想要那些文件发生改变之后，自动更新游览器
        server: {
            baseDir: [ config.build.temp, config.build.src, config.build.public], // 网站根目录. 第一个未找到，以此往后查找
            // 加特殊的路由，针对某些特定的路径名称，统一指定到某一个目录下
            // 请求发生变化 routes 优于 baseDir 的顺序
            routes: {
                '/node_modules': 'node_modules', // 这里为发生变化，查找问题
            },
        }
    })

    // PS：bs.init 中 files 字段可以不用，但是需要在任务最后 .pipe(bs.reload({ stream: true })) 这种方式亦可
}

// 检测 dist 目录里 html 文件 修改 外联文件的路径
// <!-- build:css assets/styles/vendor.css -->
// <link rel="stylesheet" href="/node_modules/bootstrap/dist/css/bootstrap.css">
// <!-- endbuild -->
// 例如 会检测 build:css endbuild 替换中间的href属性值。 转义结果如下
// <link rel="stylesheet" href="assets/styles/vendor.css">
const useref = () => {
    return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
        .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
        // html css js  此刻需要操作三种格式，需要 gulp-if 操作
        .pipe(plugins.if(/\.js$/, plugins.uglify()))
        .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
        .pipe(plugins.if(/\.html$/, plugins.htmlmin({
            collapseWhitespace: true,
            minifyCSS: true, // 压缩 html 内的 css 空白字符
            minifyJS: true, // 压缩 html 内的 js 空白字符
        })))
        .pipe(dest(config.build.dist)) // 此时 会有冲突，边写，边压缩
}

// 编译过程放一起，打包过程放一起
const compile = parallel(style, script, page)

// 上线之前的操作任务
// 先删除，后转换。异步操作
const build = series(
    clean, 
    parallel(
        series(compile, useref),
        image, 
        font, 
        extra
    )
)

const devlop = series(compile, serve)

// exports.style = done => {} 与下边等价
// module.exports = {
//     style,
//     script,
//     page
// }


// 规定那些任务需要私有，那些任务需要抛出
// 可以把这些任务防止 scripts 命令行
module.exports = {
    clean,
    build,
    devlop,
}