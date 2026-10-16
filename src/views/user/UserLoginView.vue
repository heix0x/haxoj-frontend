<template>
  <div class="login-view">
    <div class="login-card">
      <h2 class="title">用户登录</h2>

      <a-form :model="form" @submit="handleSubmit" layout="vertical">
        <a-form-item label="账号" required>
          <a-input v-model="form.userAccount" placeholder="请输入账号" size="large" />
        </a-form-item>

        <a-form-item label="密码" required>
          <a-input-password v-model="form.userPassword" placeholder="请输入密码" size="large" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" long size="large" :loading="loading">
            登录
          </a-button>
        </a-form-item>

        <div class="footer">
          <span>还没有账号？</span>
          <router-link to="/user/register">去注册</router-link>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { UserControllerService } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = ref({
  userAccount: '',
  userPassword: '',
})

const loading = ref(false)

const handleSubmit = async () => {
  // 表单验证
  if (!form.value.userAccount || !form.value.userPassword) {
    Message.warning('请填写完整信息')
    return
  }

  loading.value = true

  try {
    const res = await UserControllerService.userLoginUsingPost({
      userLoginRequest: {
        userAccount: form.value.userAccount,
        userPassword: form.value.userPassword,
      },
    })

    if (res.code === 0) {
      Message.success('登录成功')
      console.log('登录成功，准备获取用户信息...')

      // 更新用户信息
      await userStore.getLoginUser()

      console.log('当前用户状态:', userStore.userInfo)

      // 跳转到之前页面或首页
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    } else {
      Message.error('登录失败：' + (res.message || '未知错误'))
    }
  } catch (error) {
    console.error('登录失败', error)
    Message.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.footer {
  text-align: center;
  margin-top: 16px;
  color: #666;
}

.footer a {
  color: #165dff;
  margin-left: 8px;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}
</style>
