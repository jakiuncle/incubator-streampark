<!--
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->
<script lang="ts">
  export default {
    name: 'DependApp',
  };
</script>
<script setup lang="ts" name="DependApp">
  import { useRoute, useRouter } from 'vue-router';
  import { fetchDependApps } from '/@/api/system/variable';
  import Icon from '/@/components/Icon';
  import { PageWrapper } from '/@/components/Page';
  import { BasicTable, useTable } from '/@/components/Table';

  const route = useRoute();
  const router = useRouter();
  const [registerTable] = useTable({
    title: 'Variable Depend Apps',
    api: fetchDependApps,
    canResize: false,
    showIndexColumn: false,
    showTableSetting: true,
    tableSetting: { setting: true },
    beforeFetch(params: Recordable) {
      Object.assign(params, {
        variableCode: route.query.id,
      });
      return params;
    },
    columns: [
      { title: 'Application Name', dataIndex: 'jobName', width: 500 },
      { title: 'Owner', dataIndex: 'nickName' },
      { title: 'Create Time', dataIndex: 'createTime' },
    ],
  });
</script>

<template>
  <PageWrapper content-full-height>
    <div class="mb-15px py-24px px-10px bg-white">
      <a-button
        type="primary"
        shape="circle"
        @click="router.back()"
        class="float-right mr-10px -mt-8px"
      >
        <Icon icon="ant-design:arrow-left-outlined" />
      </a-button>
      <span class="app-bar">Variable "{{ route.query.id }}" used list</span>
    </div>
    <BasicTable @register="registerTable" />
  </PageWrapper>
</template>

<style lang="less">
  .app-bar {
    background-color: @background-color-base;
    height: 100%;
    font-weight: normal;
    margin: 0 32px 0 0;
    padding: 8px 12px;
  }
</style>
