<template>
  <el-row :gutter="24" style="margin: 0">
    <el-col :span="6">
      <dv-border-box-1>
        <dv-decoration-7
          style="width: 100%; height: 30px; color: #42b983; font-weight: 800"
          >域名安全威胁场景</dv-decoration-7
        >
        <el-row
          style="height: 50px; width: 90%; margin-left: 5%; margin-right: 5%"
          justify="space-between"
        >
          <el-col
            :span="12"
            style="color: white; display: flex; justify-content: flex-start"
            >根域名删除</el-col
          >
          <el-col :span="12" style="display: flex; justify-content: flex-end"
            ><div class="grid-content ep-bg-purple-light" />
            <div v-show="!ifSimulate1">
              <el-button
                v-if="!ifSimulate3 && !ifSimulate2"
                type="primary"
                round
                @click="startSimulate(1)"
                >{{ simulateText }}</el-button
              >
              <el-button
                v-else
                disabled
                type="primary"
                round
                @click="startSimulate(1)"
                >启动模拟</el-button
              >
            </div>
            <div v-show="ifSimulate1">
              <el-button type="primary" round @click="stopSimulate(1)">{{
                simulateText
              }}</el-button>
            </div></el-col
          >
        </el-row>
        <el-row
          style="height: 50px; width: 90%; margin-left: 5%; margin-right: 5%"
          justify="space-between"
        >
          <el-col
            :span="12"
            style="color: white; display: flex; justify-content: flex-start"
            >域名撤销</el-col
          >
          <el-col :span="12" style="display: flex; justify-content: flex-end"
            ><div class="grid-content ep-bg-purple-light" />
            <div v-show="!ifSimulate2">
              <el-button
                v-if="!ifSimulate1 && !ifSimulate3"
                type="primary"
                round
                @click="startSimulate(2)"
                >{{ simulateText }}</el-button
              >
              <el-button
                v-else
                disabled
                type="primary"
                round
                @click="startSimulate(2)"
                >启动模拟</el-button
              >
            </div>
            <div v-show="ifSimulate2">
              <el-button type="primary" round @click="stopSimulate(2)">{{
                simulateText
              }}</el-button>
            </div></el-col
          >
        </el-row>
        <el-row
          style="height: 50px; width: 90%; margin-left: 5%; margin-right: 5%"
          justify="space-between"
        >
          <el-col
            :span="12"
            style="color: white; display: flex; justify-content: flex-start"
            >域名篡改</el-col
          >
          <el-col :span="12" style="display: flex; justify-content: flex-end"
            ><div class="grid-content ep-bg-purple-light" />
            <div v-show="!ifSimulate3">
              <el-button
                v-if="!ifSimulate1 && !ifSimulate2"
                type="primary"
                round
                @click="startSimulate(3)"
                >{{ simulateText }}</el-button
              >
              <el-button
                v-else
                disabled
                type="primary"
                round
                @click="startSimulate(3)"
                >启动模拟</el-button
              >
            </div>
            <div v-show="ifSimulate3">
              <el-button type="primary" round @click="stopSimulate(3)">{{
                simulateText
              }}</el-button>
            </div></el-col
          >
        </el-row>

        <dv-decoration-7
          style="width: 100%; height: 30px; color: #42b983; font-weight: 800"
          >模拟影响网段</dv-decoration-7
        >
        <dv-scroll-board
          :config="ipconfig"
          style="width: 90%; margin-left: 5%; height: 220px"
        />
        <dv-decoration-7
          style="width: 100%; height: 30px; color: #42b983; font-weight: 800"
          >实时流量列表</dv-decoration-7
        >
        <dv-scroll-board
          :config="trafficconfig"
          style="margin-left: 5%; width: 90%; height: 220px"
        />
      </dv-border-box-1>
    </el-col>
    <el-col :span="18">
      <div class="echarts">
        <div id="container2"></div>
      </div>
    </el-col>
    <div id="centerDialog" class="modal" v-show="centerDialogVisible">
      <p>{{ nodeInfo.ip }}</p>
      <p>{{ nodeInfo.name }}</p>
      <p>{{ nodeInfo.city }}</p>
      <p>{{ nodeInfo.domain }}</p>
      <el-button @click="centerDialogVisible = false" round>&times;</el-button>
    </div>
  </el-row>
</template>

<style lang="scss" scoped>
.echarts {
  width: 100%;
  height: 85vh;
  overflow: hidden;
}

#container2 {
  width: 100%;
  margin-top: -20vh;
}

.modal {
  display: block;
  position: fixed;
  z-index: 20;
  left: 0;
  top: 0;
  width: 200px;
  height: 200px;
  overflow: auto;
  background-color: #011946;
  color: white;
  border: 2px solid white;
}
</style>

<script lang="ts" setup>
import earthFlyLine from "earth-flyline";
import * as echarts from "echarts";
import {
  onMounted,
  onActivated,
  ref,
  onDeactivated,
  reactive,
  onUnmounted,
  nextTick,
  onBeforeUnmount,
} from "vue";
import world from "@/map/world.json";
import node from "@/image/dataserver-security.svg";
import location from "@/image/location.svg";
import resolver_node from "@/image/resolver2.svg";
const simulateText = ref("启动模拟");
const centerDialogVisible = ref(false);
const ifSimulate1 = ref(false);
const ifSimulate2 = ref(false);
const ifSimulate3 = ref(false);
const chartRef = ref<earthFlyLine.ChartScene | null>(null);
const nodeInfo = ref({});
const reportTable = ref();
const nodeAll = ref([]);

const trafficconfig = ref({
  header: ["递归IP", "节点名称", "域名", "时间"],
  data: [],
  align: ["center", "center", "center", "center"],
});
let lineID = 1;
let simLineID = 100000000;
const fetchTime = 2000;
const ipconfig = {
  header: ["主机名", "主机IP", "所属网段"],
  data: [["模拟主机1", "202.112.47.212", "202.112.47.0/24"]],
  align: ["center", "center", "center"],
};

let pollingInterval;

function startSimulate(num) {
  if (num === 1) ifSimulate1.value = true;
  else if (num === 2) ifSimulate2.value = true;
  else if (num === 3) ifSimulate3.value = true;
  simulateText.value = "正在启动";
  Promise.all([
    fetch("/api/backgorund?state=stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }),
    fetch("/api/simulate?state=start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }),
    fetch("/api/simresolvers"),
  ])
    .then((responses) => {
      return Promise.all(responses.map((response) => response.json()));
    })
    .then(([backgroundData, simulateData, simresolver]) => {
      // trafficconfig.value = {
      //   header: ["递归IP", "节点名称", "域名", "时间"],
      //   data: [],
      //   align: ["center", "center", "center", "center"],
      // };

      console.log("Background data:", backgroundData);
      console.log("Simulate data:", simulateData);
      stopPolling();

      // setTimeout(() => {
      //   chartRef.value.remove("flyLine", "removeAll");
      //   startPolling(1);
      // }, fetchTime * 2);
      startPolling(1);
      console.log(simresolver);

      chartRef.value.addData("point", [
        {
          id: `${10000000}`,
          lat: simresolver.loc.latitude,
          lon: simresolver.loc.longitude,
          style: {
            color: "red",
            duration: 0,
            customFigure: {
              texture: resolver_node,
            },
          },
        },
      ]);
    })

    .catch((error) => {
      console.error("Error:", error);
    });
}

function stopSimulate(num) {
  simulateText.value = "正在关闭";
  Promise.all([
    fetch("/api/backgorund?state=start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }),
    fetch("/api/simulate?state=stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }),
  ])
    .then((responses) => {
      return Promise.all(responses.map((response) => response.json()));
    })
    .then(([backgroundData, simulateData]) => {
      // trafficconfig.value = {
      //   header: ["递归IP", "节点名称", "域名", "时间"],
      //   data: [],
      //   align: ["center", "center", "center", "center"],
      // };
      console.log("Background data:", backgroundData);
      console.log("Simulate data:", simulateData);
      stopPolling();

      // setTimeout(() => {
      //   chartRef.value.remove("flyLine", "removeAll");

      //   chartRef.value.remove("point", [`${10000000}`]);

      //   startPolling(0);
      //   if (num === 1) ifSimulate1.value = false;
      //   else if (num === 2) ifSimulate2.value = false;
      //   else if (num === 3) ifSimulate3.value = false;
      // }, fetchTime * 2);
      chartRef.value.remove("point", [`${10000000}`]);

      startPolling(0);
      if (num === 1) ifSimulate1.value = false;
      else if (num === 2) ifSimulate2.value = false;
      else if (num === 3) ifSimulate3.value = false;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function startPolling(mode) {
  if (mode) simulateText.value = "关闭模拟";
  else simulateText.value = "启动模拟";
  pollingInterval = setInterval(() => {
    if (mode) {
      fetchData(
        "?filter=3.22.98.109&num=1000&since=" +
          (new Date().getTime() - 2200) * 1000
      );
      fetchData("?filter=resolvers");
    } else fetchData("?filter=resolvers");
  }, fetchTime);
}

function stopPolling() {
  clearInterval(pollingInterval);
}

function fetchData(params) {
  fetch("/api/requests" + params)
    .then((response) => response.json())
    .then((res) => {
      const d = [];
      d.push(res[0].Src);
      let nodeIndex = nodeAll.value
        .map((item) => item.ip)
        .findIndex((item) => item == res[0].Dst);
      d.push(nodeAll.value[nodeIndex].name);

      d.push(res[0].Name);
      d.push(timestampToTime(res[0].Time));
      let trafficConfigData = [...trafficconfig.value.data];
      // 如果trafficConfigData已经有10个元素,则移除最早的一个
      if (trafficConfigData.length >= 5) {
        trafficConfigData.shift();
      }
      // 添加最新的一个
      trafficConfigData.push(d);
      trafficconfig.value = {
        header: ["递归IP", "节点名称", "域名", "时间"],
        data: trafficConfigData,
        align: ["center", "center", "center", "center"],
      };

      const d2 = [];
      d2.push(res[1].Src);
      nodeIndex = nodeAll.value
        .map((item) => item.ip)
        .findIndex((item) => item == res[1].Dst);
      d2.push(nodeAll.value[nodeIndex].name);
      d2.push(res[1].Name);
      d2.push(timestampToTime(res[1].Time));
      setTimeout(() => {
        let trafficConfigData = [...trafficconfig.value.data];
        // 如果trafficConfigData已经有10个元素,则移除最早的一个
        if (trafficConfigData.length >= 5) {
          trafficConfigData.shift();
        }
        // 添加最新的一个
        trafficConfigData.push(d2);
        trafficconfig.value = {
          header: ["递归IP", "节点名称", "域名", "时间"],
          data: trafficConfigData,
          align: ["center", "center", "center", "center"],
        };
      }, fetchTime / 2);

      res.forEach((item, index) => {
        const delay = (index * fetchTime) / res.length; // 计算每个飞线动画的延迟时间

        setTimeout(() => {
          chartRef.value.addData("flyLine", [
            {
              from: {
                id: params !== "?filter=resolvers" ? simLineID : lineID,
                lon: item.From.longitude,
                lat: item.From.latitude,
                style: {
                  customFigure: {
                    texture: location,
                  },
                },
              },
              to: {
                id: params !== "?filter=resolvers" ? simLineID + 1 : lineID + 1,
                lon: item.To.longitude,
                lat: item.To.latitude,
                style: {
                  customFigure: {
                    texture: location,
                  },
                },
              },
              style: {
                pathStyle: {
                  color: params !== "?filter=resolvers" ? "yellow" : "#42b983",
                  show: false,
                },
                flyLineStyle: {
                  color: params !== "?filter=resolvers" ? "yellow" : "#42b983",
                  duration: fetchTime, // 每个飞线动画持续
                  delay: 0, // 延迟时间由外部 setTimeout 控制
                  repeat: 0, // 循环次数为无限
                  onComplete: (params) => {
                    chartRef.value.remove("flyLine", [
                      `${params.from.id}-${params.to.id}`,
                    ]);
                  },
                },
              },
            },
          ]);
          if (params != "?filter=resolvers") simLineID += 2;
          else lineID += 2;
        }, delay);
      });
    })
    .catch((error) => {
      // Handle the error
      console.error(error);
    });
}

onMounted(() => {
  Promise.all([
    fetch("/api/nodes").then((response) => response.json()),
    fetch("/api/resolvers").then((response) => response.json()),
  ])
    .then(([nodes, resolvers]) => {
      // scrollUp();
      nodeAll.value = nodes;
      earthFlyLine.registerMap("world", world);
      const dom = document.getElementById("container2");
      let width = dom.offsetWidth;
      dom.style.height = width + "px";

      chartRef.value = earthFlyLine.init({
        dom,
        map: "world",
        mode: "2d",
        config: {
          enableZoom: false,
          hoverRegionStyle: {
            areaColor: "#2e3564",
          },
          mapStyle: {
            areaColor: "#2e3564",
            lineColor: "#797eff",
          },
        },
      });
      //新增数据
      nodes.map((item) => {
        chartRef.value.addData("point", [
          {
            lat: item.location.latitude,
            lon: item.location.longitude,
            style: {
              color: "white",
              duration: 0,
              customFigure: {
                texture: node,
              },
            },
            domain: item.domain,
            name: item.name,
            ip: item.ip,
            city: item.city,
            software: item.sofeware,
          },
        ]);
      });
      resolvers.map((item) => {
        chartRef.value.addData("point", [
          {
            lat: item.loc.latitude,
            lon: item.loc.longitude,
            style: {
              color: "green",
              duration: 0,
              customFigure: {
                texture: resolver_node,
              },
            },
          },
        ]);
      });
      console.log("初始化地图成功");

      startPolling(0);
    })
    .catch((error) => {
      console.error(error);
    });
});

onBeforeUnmount(() => {
  stopPolling();
});

/* 时间戳转换为时间 */
function timestampToTime(timestamp) {
  timestamp = timestamp ? timestamp : null;
  let date = new Date(Math.round(timestamp / 1000)); //时间戳为10位需*1000，时间戳为13位的话不需乘1000
  let Y = date.getFullYear() + "-";
  let M =
    (date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1) + "-";
  let D = (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + " ";
  let h =
    (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":";
  let m =
    (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) +
    ":";
  let s = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
  return Y + M + D + h + m + s;
}
</script>
