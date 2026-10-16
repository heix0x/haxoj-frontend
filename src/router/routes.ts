import ACCESS_ENUM from '@/access/accessEnum'

const routes = [
  // 统一的父框架路由（所有需要顶部菜单的页面都在这里）
  {
    path: '/',
    name: 'Root',
    component: () => import('@/layouts/BasicLayout.vue'),
    children: [
      // 首页
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页', access: ACCESS_ENUM.NOT_LOGIN },
      },
      // 题库
      {
        path: 'problems',
        name: 'Problems',
        component: () => import('@/views/Problems.vue'),
        meta: { title: '题库', access: ACCESS_ENUM.NOT_LOGIN },
      },
      // 比赛
      {
        path: 'contests',
        name: 'Contests',
        component: () => import('@/views/Contests.vue'),
        meta: { title: '比赛', access: ACCESS_ENUM.NOT_LOGIN },
      },
      // 排名
      {
        path: 'ranking',
        name: 'Ranking',
        component: () => import('@/views/Ranking.vue'),
        meta: { title: '排名', access: ACCESS_ENUM.NOT_LOGIN },
      },
      // 关于
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About.vue'),
        meta: { title: '关于', access: ACCESS_ENUM.NOT_LOGIN },
      },
      // 用户中心
      {
        path: 'user/center',
        name: 'UserCenter',
        component: () => import('@/views/User.vue'),
        meta: { title: '用户中心', access: ACCESS_ENUM.USER },
      },
      // 管理员中心
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/Admin.vue'),
        meta: { title: '管理员中心', access: ACCESS_ENUM.ADMIN },
      },
    ],
  },

  // 独立页面（不需要顶部菜单）
  {
    path: '/user/login',
    name: 'UserLogin',
    component: () => import('@/views/user/UserLoginView.vue'),
    meta: { title: '用户登录', access: ACCESS_ENUM.NOT_LOGIN, hideInMenu: true },
  },
  {
    path: '/user/register',
    name: 'UserRegister',
    component: () => import('@/views/user/UserRegisterView.vue'),
    meta: { title: '用户注册', access: ACCESS_ENUM.NOT_LOGIN, hideInMenu: true },
  },
  {
    path: '/noAuth',
    name: 'NoAuth',
    component: () => import('@/views/NoAuth.vue'),
    meta: { title: '无权限', access: ACCESS_ENUM.NOT_LOGIN, hideInMenu: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '404 Not Found', access: ACCESS_ENUM.NOT_LOGIN, hideInMenu: true },
  },
]

export default routes
