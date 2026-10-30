import ACCESS_ENUM from '@/access/accessEnum'

/**
 * 路由表约定：
 * - meta.title     页面标题，也作为顶栏菜单文案（有 title 且未 hideInMenu 的会显示在顶栏）
 * - meta.access    访问所需权限：NOT_LOGIN 任何用户 / USER 登录用户 / ADMIN 管理员
 * - meta.hideInMenu  true 时不出现在菜单中（如"创建题目"这类二级页面）
 * - meta.activeMenu  隐藏页面用于指定高亮的菜单项 key
 *
 * 管理后台路由说明：
 *   /admin 本身只是一个"分组"（不带 component，vue-router 渲染时会自动穿透），
 *   真正的页面是它的子路由 /admin/overview、/admin/users、/admin/questions……
 *   这样每个管理功能都有独立 URL，可直接访问 / 刷新 / 收藏，无需中间跳板页。
 *
 * 页面访问控制：菜单按 meta.access 过滤 + router/index.ts 全局守卫兜底
 */
const routes = [
  // ==================== 主布局（带顶栏菜单） ====================
  {
    path: '/',
    name: 'Root',
    component: () => import('@/layouts/BasicLayout.vue'),
    children: [
      // ---------- 公共页面（所有人可见） ----------
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'problems',
        name: 'Problems',
        component: () => import('@/views/Problems.vue'),
        meta: { title: '题库' },
      },
      {
        // 做题页：题目 id 作为路径参数（雪花 ID 为 19 位字符串，全程保持字符串不要转 Number）
        path: 'problems/:id',
        name: 'ProblemDetail',
        component: () => import('@/views/ProblemDetail.vue'),
        // 二级页面不在菜单展示，但高亮"题库"菜单项
        meta: { title: '做题', hideInMenu: true, activeMenu: 'problems' },
      },
      {
        // 提交记录：当前用户本人的提交历史。
        // 后端 /question_submit/my/list/page 强制按登录人过滤，接口本身不需要传 userId
        path: 'submissions',
        name: 'Submissions',
        component: () => import('@/views/Submissions.vue'),
        meta: { title: '提交记录', access: ACCESS_ENUM.USER },
      },
      {
        path: 'contests',
        name: 'Contests',
        component: () => import('@/views/Contests.vue'),
        meta: { title: '比赛' },
      },
      {
        path: 'ranking',
        name: 'Ranking',
        component: () => import('@/views/Ranking.vue'),
        meta: { title: '排名' },
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About.vue'),
        meta: { title: '关于' },
      },

      // ---------- 需登录 ----------
      {
        path: 'user/center',
        name: 'UserCenter',
        component: () => import('@/views/User.vue'),
        meta: { title: '用户中心', access: ACCESS_ENUM.USER },
      },

      // ---------- 管理后台（仅管理员，顶栏"管理员中心"悬停下拉进入） ----------
      {
        path: 'admin',
        name: 'Admin',
        // 分组路由：不带 component，进入 /admin 直接重定向到概览页
        redirect: '/admin/overview',
        meta: { title: '管理员中心', access: ACCESS_ENUM.ADMIN },
        children: [
          {
            path: 'overview',
            name: 'AdminOverview',
            component: () => import('@/views/Admin.vue'),
            meta: { title: '概览' },
          },
          {
            path: 'users',
            name: 'AdminUsers',
            component: () => import('@/views/AdminUsers.vue'),
            meta: { title: '用户管理' },
          },
          {
            path: 'questions',
            name: 'AdminQuestions',
            component: () => import('@/views/ManageQuestion.vue'),
            meta: { title: '题目管理' },
          },
          {
            path: 'questions/create',
            name: 'AdminCreateQuestion',
            component: () => import('@/views/CreateQuestion.vue'),
            // 新增/编辑题目：不在下拉菜单展示，从题目管理页进入
            meta: { title: '创建题目', hideInMenu: true, activeMenu: 'admin/questions' },
          },
          {
            path: 'contests',
            name: 'AdminContests',
            component: () => import('@/views/AdminPlaceholder.vue'),
            meta: { title: '比赛管理' },
          },
          {
            path: 'settings',
            name: 'AdminSettings',
            component: () => import('@/views/AdminPlaceholder.vue'),
            meta: { title: '系统设置' },
          },
        ],
      },
    ],
  },

  // ==================== 用户独立布局（登录/注册，无顶栏） ====================
  {
    path: '/user',
    name: 'UserLayout',
    component: () => import('@/layouts/UserLayout.vue'),
    meta: { hideInMenu: true },
    children: [
      {
        path: 'login',
        name: 'UserLogin',
        component: () => import('@/views/user/UserLoginView.vue'),
        meta: { title: '用户登录', hideInMenu: true },
      },
      {
        path: 'register',
        name: 'UserRegister',
        component: () => import('@/views/user/UserRegisterView.vue'),
        meta: { title: '用户注册', hideInMenu: true },
      },
    ],
  },

  // ==================== 特殊页 ====================
  {
    path: '/noAuth',
    name: 'NoAuth',
    component: () => import('@/views/NoAuth.vue'),
    meta: { title: '无权限', hideInMenu: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '404 Not Found', hideInMenu: true },
  },
]

export default routes
