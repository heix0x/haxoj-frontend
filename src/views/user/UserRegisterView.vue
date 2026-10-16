<template>
  <div class="register-view">
    <div class="register-card">
      <h2 class="title">用户注册</h2>

      <a-form :model="form" @submit="handleSubmit" layout="vertical">
        <a-form-item label="账号" required>
          <a-input v-model="form.userAccount" placeholder="请输入账号" size="large" />
        </a-form-item>

        <a-form-item label="密码" required>
          <a-input-password v-model="form.userPassword" placeholder="请输入密码" size="large" />
        </a-form-item>

        <a-form-item label="确认密码" required>
          <a-input-password v-model="confirmPassword" placeholder="请再次输入密码" size="large" />
        </a-form-item>

        <a-form-item label="昵称" required>
          <a-input v-model="form.userName" placeholder="请输入昵称" size="large" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" long size="large" :loading="loading">
            注册
          </a-button>
        </a-form-item>

        <div class="footer">
          <span>已有账号？</span>
          <router-link to="/user/login">去登录</router-link>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { UserControllerService } from '@/api'

const router = useRouter()

const form = ref({
  userAccount: '',
  userPassword: '',
  userName: '',
})

const confirmPassword = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  // 表单验证
  if (!form.value.userAccount || !form.value.userPassword || !form.value.userName) {
    Message.warning('请填写完整信息')
    return
  }

  // 验证密码
  if (form.value.userPassword !== confirmPassword.value) {
    Message.error('两次输入的密码不一致')
    return
  }

  // 验证密码长度
  if (form.value.userPassword.length < 8) {
    Message.error('密码长度不能少于8位')
    return
  }

  loading.value = true

  try {
    const res = await UserControllerService.userRegisterUsingPost({
      userRegisterRequest: {
        userAccount: form.value.userAccount,
        userPassword: form.value.userPassword,
        checkPassword: confirmPassword.value,
        userName: form.value.userName,
      },
    })

    if (res.code === 0) {
      Message.success('注册成功')
      // 跳转到登录页面
      router.push('/user/login')
    } else {
      Message.error('注册失败：' + (res.message || '未知错误'))
    }
  } catch (error) {
    console.error('注册失败', error)
    Message.error('注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-view {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-card {
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
