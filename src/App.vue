<template>
  <el-row :gutter="24">
    <el-col :span="6">
      <nav>
        <router-link to="/">系统状态</router-link> |
        <router-link to="/help">威胁模拟</router-link>
      </nav>
      <dv-decoration-8 style="width: 400px; height: 50px" />
    </el-col>
    <el-col :span="18">
      <div style="display: flex; justify-content: center">
        <dv-decoration-5 style="width: 600px; height: 40px" />
      </div>
      <dv-decoration-11 style="width: 80%; height: 80px; margin-left: 10%"
        ><h1 class="title">境内外一体化抗停服域名解析系统</h1></dv-decoration-11
      >
    </el-col>
  </el-row>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<style lang="scss">
.title {
  color: #42b983;
}

#app {
  font-family: "Microsoft Yahei", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background-color: #040d21;
  height: 100vh;
}
nav {
  flex: 1;
  justify-content: end;
  padding-top: 30px;
  height: 20px;
  align-items: center;
  a {
    font-weight: bold;
    color: #2c3e50;
    font-size: 20px;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
