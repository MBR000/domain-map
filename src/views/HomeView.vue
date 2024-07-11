<template>
  <el-row :gutter="24" style="margin: 0">
    <el-col :span="6">
      <dv-border-box-1>
        <dv-decoration-7
          style="width: 100%; height: 30px; color: #42b983; font-weight: 800"
          >节点列表</dv-decoration-7
        >
        <dv-scroll-board
          :config="nodeData"
          style="margin-left: 5%; width: 90%; height: 220px"
        />
        <!-- <el-table
        ref="reportTable"
        :data="nodeData"
        style="width: 100%"
        height="120"
        :header-cell-style="{ color: '#ffffff', backgroundColor: '#011946' }"
        :cell-style="{ color: '#ffffff', backgroundColor: '#011946' }"
      >
        <el-table-column prop="domain" label="节点域名" />
        <el-table-column prop="city" label="地理位置" />
      </el-table> -->
        <dv-decoration-7
          style="width: 100%; height: 30px; color: #42b983; font-weight: 800"
          >域名解析流量</dv-decoration-7
        >
        <div id="bar1" style="width: 100%; height: 100px"></div>
        <dv-decoration-7
          style="width: 100%; height: 30px; color: #42b983; font-weight: 800"
          >最常访问域名</dv-decoration-7
        >
        <div id="bar2" style="width: 100%; height: 100px"></div>
        <dv-decoration-7
          style="width: 100%; height: 30px; color: #42b983; font-weight: 800"
          >实时流量列表</dv-decoration-7
        >
        <dv-scroll-board
          :config="trafficconfig"
          style="margin-left: 5%; width: 90%; height: 220px"
        />
        <!-- <el-table
        ref="trafficTable"
        :data="trafficData"
        style="width: 100%"
        height="120"
        :header-cell-style="{ color: '#ffffff', backgroundColor: '#011946' }"
        :cell-style="{ color: '#ffffff', backgroundColor: '#011946' }"
      >
        <el-table-column prop="Src" label="节点域名" />
        <el-table-column prop="Dst" label="地理位置" />
      </el-table> -->
      </dv-border-box-1>
    </el-col>

    <el-col :span="18">
      <div class="echarts">
        <div id="container2"></div>
      </div>
    </el-col>

    <div id="centerDialog" class="modal" v-show="centerDialogVisible">
      <table class="text-left">
        <tr>
          <td>IP:</td>
          <td>{{ nodeInfo.ip }}</td>
        </tr>
        <tr>
          <td>名称:</td>
          <td>{{ nodeInfo.name }}</td>
        </tr>
        <tr>
          <td>地点:</td>
          <td>{{ nodeInfo.city }}</td>
        </tr>
        <tr>
          <td>域名:</td>
          <td>{{ nodeInfo.domain }}</td>
        </tr>
        <tr>
          <td>机器:</td>
          <td>{{ nodeInfo.mechine }}</td>
        </tr>
        <tr>
          <td>软件:</td>
          <td>{{ nodeInfo.software }}</td>
        </tr>
        <tr>
          <td>最大QPS:</td>
          <td>{{ nodeInfo.maxqps }}</td>
        </tr>
      </table>
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
  margin-top: -30vh;
}

.modal {
  display: block;
  position: fixed;
  z-index: 20;
  left: 0;
  top: 0;
  width: 240px;
  height: 180px;
  overflow: auto;
  background-color: #011946;
  color: #42b983;
  border: 2px solid white;
}

.text-left td {
  text-align: left;
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
import node from "@/image/svg.svg";
import location from "@/image/location.svg";
const centerDialogVisible = ref(false);
const nodeData = ref({});
const nodeInfo = ref({});
const chartRef = ref<earthFlyLine.ChartScene | null>(null);
let pollingInterval;
let bartimer1;
let bartimer2;
let bartimer3;
let dialogShow = 0;
const reportTable = ref();
const trafficTable = ref();
const trafficData = ref([]);
const trafficconfig = ref({
  header: ["发送", "目的", "域名", "时间"],
  data: [],
  align: ["center", "center", "center", "center"],
});
let lineID = 0;
function scrollUp(theref) {
  nextTick(() => {
    const demo =
      theref.value.$refs.bodyWrapper.getElementsByClassName(
        "el-scrollbar__wrap"
      )[0];
    const tableScroll = ref(true);
    demo.addEventListener("mouseover", () => {
      tableScroll.value = false;
    });
    demo.addEventListener("mouseout", () => {
      tableScroll.value = true;
    });
    setInterval(() => {
      if (tableScroll.value) {
        demo.scrollTop += 10;
        if (demo.clientHeight + demo.scrollTop === demo.scrollHeight) {
          demo.scrollTop = 0;
        }
      }
    }, 100);
  });
}

const fetchTime = 2000;

function startPolling() {
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
      console.log("Background data:", backgroundData);
      console.log("Simulate data:", simulateData);
    })
    .then((data) => {
      pollingInterval = setInterval(() => {
        fetchData();
      }, fetchTime);
    })
    .finally(() => {
      // scrollUp(trafficTable);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function stopPolling() {
  clearInterval(pollingInterval);
}

function fetchData() {
  fetch("/api/requests")
    .then((response) => response.json())
    .then((res) => {
      // trafficData.value = res;
      // console.log(res[0]);
      const d = [];
      d.push(res[0].Src);
      d.push(res[0].Dst);
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
        header: ["发送", "目的", "域名", "时间"],
        data: trafficConfigData,
        align: ["center", "center", "center", "center"],
      };
      res.forEach((item, index) => {
        const delay = (index * fetchTime) / res.length; // 计算每个飞线动画的延迟时间

        setTimeout(() => {
          chartRef.value.addData("flyLine", [
            {
              from: {
                id: lineID,
                lon: item.From.longitude,
                lat: item.From.latitude,
                style: {
                  customFigure: {
                    texture: location,
                  },
                },
              },
              to: {
                id: lineID + 1,
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
                  color: "#42b983",
                  show: false,
                },
                flyLineStyle: {
                  color: "#42b983",
                  duration: 2000, // 每个飞线动画持续 2
                  delay: 0, // 延迟时间
                  repeat: 0, // 循环次数
                  onComplete: (params) => {
                    chartRef.value.remove("flyLine", [
                      `${params.from.id}-${params.to.id}`,
                    ]);
                  },
                },
              },
            },
          ]);
          lineID += 2;
        }, delay);
      });
    })
    .catch((error) => {
      // Handle the error
      console.error(error);
    });
}
onBeforeUnmount(() => {
  stopPolling();
  window.clearInterval(bartimer1);
  window.clearInterval(bartimer2);
});

onMounted(() => {
  Promise.all([
    fetch("/api/nodes").then((response) => response.json()),
    fetch("/api/qps").then((response) => response.json()),
    fetch("/api/domains/fqdns").then((response) => response.json()),
    fetch("/api/domains/slds").then((response) => response.json()),
  ])
    .then(([nodes, qps, fqdnsData, sldsData]) => {
      const nodeconfigdata = [];
      for (let item of nodes) {
        const d = [];
        d.push(item.name);
        d.push(item.city);
        d.push(item.software);
        nodeconfigdata.push(d);
      }
      nodeData.value = {
        header: ["名字", "位置", "软件"],
        data: nodeconfigdata,
        align: ["center", "center", "center"],
      };
      qps = qps.sort((a, b) => b.qps - a.qps);
      fqdnsData = fqdnsData.sort((a, b) => b.visit - a.visit);
      // scrollUp(reportTable);

      var barChart1 = echarts.init(document.getElementById("bar1"));

      var barChart2 = echarts.init(document.getElementById("bar2"));

      bartimer1 = setInterval(() => {
        barChart1.setOption({
          dataZoom: [
            {
              id: "dataZoomY",
              type: "slider",
              yAxisIndex: [0],
              filterMode: "filter",
              startValue: 0,
              endValue: 2,
            },
          ],
          tooltip: {},
          yAxis: {
            type: "category",
            data: qps.map((item) => item.ip),
          },
          xAxis: {
            type: "value",
            min: 0,
            max: Math.max(
              ...qps.map((item) => Math.round(item.qps * 100) / 100)
            ),
            splitNumber: 5,
            axisTick: {
              show: true,
              length: 10,
              lineStyle: {
                color: "#333",
              },
            },
          },
          series: [
            {
              name: "qps",
              type: "bar",
              data: qps.map((item) => Math.round(item.qps * 100) / 100),
              barWidth: 5,
              label: {
                show: true,
                position: "inside",
              },
            },
          ],
          grid: {
            height: "100%",
            left: 130,
            top: 0,
          },
        });
        const item1 = qps.shift();
        qps.push(item1);
      }, 2000);
      bartimer2 = setInterval(() => {
        barChart2.setOption({
          dataZoom: [
            {
              id: "dataZoomY",
              type: "slider",
              yAxisIndex: [0],
              filterMode: "filter", // 设定为 'filter' 从而 X 的窗口变化会影响 Y 的范围。
              startValue: 0,
              endValue: 2,
            },
          ],
          tooltip: {},
          yAxis: {
            type: "category",
            data: fqdnsData.map((item) => item.domain),
            axisLabel: {
              interval: 0,
            },
          },
          xAxis: {
            type: "value",
            min: 0,
            max: Math.max(...fqdnsData.map((item) => item.visit)),
            splitNumber: 5,
            axisTick: {
              show: true,
              length: 10,
              lineStyle: {
                color: "#333",
              },
            },
          },
          series: [
            {
              name: "qps",
              type: "bar",
              data: fqdnsData.map((item) => item.visit),
              barWidth: 5,
              label: {
                show: true,
                position: "inside",
              },
            },
          ],
          // Adjust the chart height to show the scrollbar
          grid: {
            height: "100%",
            left: 130,
            top: 0,
          },
        });
        const item2 = fqdnsData.shift();
        fqdnsData.push(item2);
      }, 2000);

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
              duration: 2000,
              customFigure: {
                texture: node,
              },
            },
            domain: item.domain,
            name: item.name,
            ip: item.ip,
            city: item.city,
            software: item.software,
            mechine: item.mechine,
            maxqps: item.maxqps,
          },
        ]);
      });
      const centerDialog = document.getElementById("centerDialog");
      console.log("初始化地图成功");

      // chartRef.value.on("click", (event, params) => {
      //   console.log(params.scatter);
      //   //如果点击到点，出现弹窗展示
      //   if (params && params.name === "scatter") {
      //     nodeInfo.value.name = params?.userData.name;
      //     nodeInfo.value.city = params?.userData.city;
      //     nodeInfo.value.domain = params?.userData.domain;
      //     nodeInfo.value.ip = params?.userData.ip;
      //     nodeInfo.value.software = params?.userData.software;
      //     nodeInfo.value.mechine = params?.userData.mechine;
      //     nodeInfo.value.maxqps = params?.userData.maxqps;
      //     if (event.clientX < 900) {
      //       centerDialog.style.left = `${event.clientX}px`;
      //     } else {
      //       centerDialog.style.left = `${event.clientX - 240}px`;
      //     }
      //     if (event.clientY < 400) {
      //       centerDialog.style.top = `${event.clientY}px`;
      //     } else {
      //       centerDialog.style.top = `${event.clientY - 180}px`;
      //     }
      //     centerDialogVisible.value = true;
      //   }
      // });
      const paths = nodes.map((item) => {
        return [
          {
            lat: -50,
            lon: -130,
          },

          {
            lat: -50,
            lon: item.location.longitude,
          },
          {
            lat: item.location.latitude,
            lon: item.location.longitude,
          },
        ];
      });
      bartimer3 = setInterval(() => {
        const roadData = [
          {
            id: `${(dialogShow + 1) % nodes.length}`, //必填
            path: paths[(dialogShow + 1) % nodes.length],
            style: {
              flyLineStyle: {
                color: "white",
                duration: 0, // 一个完成动画所需时间(单位毫秒)，值越小动画速度越快
                delay: 0, //延迟执行时间默认
                repeat: 0, //循环次数 无限循环
              },
              pathStyle: {
                color: "white",
                show: false,
              },
            },
          },
        ];
        chartRef.value.remove("road", [`${dialogShow % nodes.length}`]);
        chartRef.value.addData("road", roadData);

        dialogShow += 1;
        nodeInfo.value.name = nodes[dialogShow % nodes.length]?.name;
        nodeInfo.value.city = nodes[dialogShow % nodes.length]?.city;
        nodeInfo.value.domain = nodes[dialogShow % nodes.length]?.domain;
        nodeInfo.value.ip = nodes[dialogShow % nodes.length]?.ip;
        nodeInfo.value.software = nodes[dialogShow % nodes.length]?.software;
        nodeInfo.value.mechine = nodes[dialogShow % nodes.length]?.mechine;
        nodeInfo.value.maxqps = nodes[dialogShow % nodes.length]?.maxqps;
      }, 2000);
      centerDialog.style.left = "30vw";
      centerDialog.style.top = "60vh";
      centerDialogVisible.value = true;
      startPolling();
    })
    .catch((error) => {
      console.error(error);
    });
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
