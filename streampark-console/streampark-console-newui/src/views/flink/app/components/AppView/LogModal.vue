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
  import { defineComponent } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useLog } from '../../hooks/useLog';
  export default defineComponent({
    name: 'LogModal',
  });
</script>
<script setup lang="ts" name="LogModal">
  import { reactive, ref, unref } from 'vue';
  import { fetchStartLog } from '/@/api/flink/app/app';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { Icon } from '/@/components/Icon';
  import { formatToDateTime } from '/@/utils/dateUtil';
  import { useTimeoutFn } from '@vueuse/shared';

  const { t } = useI18n();
  const logTime = ref<string>('');
  const getLogLoading = ref<boolean>(false);
  const app = reactive<Recordable>({});

  const [registerModal, { changeLoading, closeModal }] = useModalInner((data) => {
    data && onReceiveModalData(data);
  });

  const { setContent, logRef, handleRevealLine } = useLog();

  function onReceiveModalData(data) {
    Object.assign(app, unref(data.app));
    changeLoading(true);
    refreshLog();
    start();
  }
  const { start, stop } = useTimeoutFn(
    () => {
      refreshLog();
      start();
    },
    3000,
    { immediate: false },
  );

  async function refreshLog() {
    try {
      getLogLoading.value = true;
      const { data } = await fetchStartLog({
        namespace: app.k8sNamespace,
        jobName: app.jobName,
        limit: 100000000,
        skipLineNum: 0,
      });
      const status = data.status || 'error';
      if (status === 'success') {
        setContent(data.data);
        handleRevealLine();
        logTime.value = formatToDateTime(new Date());
      }
    } catch (error) {
      closeModal();
      console.error('logModal error', error);
    } finally {
      getLogLoading.value = false;
      changeLoading(false);
    }
  }

  async function handleClose() {
    stop();
  }
</script>
<template>
  <BasicModal
    canFullscreen
    :scrollTop="false"
    @register="registerModal"
    width="80%"
    :after-close="handleClose"
  >
    <template #title>
      <Icon icon="ant-design:code-outlined" style="color: #477de9" />&nbsp;
      <span> {{ t('flink.app.view.logTitle', [app.jobName]) }}</span>
    </template>
    <div ref="logRef" class="h-full min-h-500px"></div>
    <template #footer>
      <div class="flex align-items-center">
        <div class="flex-1 text-left">{{ t('flink.app.view.refreshTime') }}:{{ logTime }}</div>
        <div class="button-group">
          <a-button key="refresh" type="primary" @click="refreshLog" :loading="getLogLoading">
            {{ t('flink.app.view.refresh') }}
          </a-button>
          <a-button key="close" type="primary" @click="closeModal()">
            {{ t('common.closeText') }}
          </a-button>
        </div>
      </div>
    </template>
  </BasicModal>
</template>
