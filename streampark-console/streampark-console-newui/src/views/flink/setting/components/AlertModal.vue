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
  export default defineComponent({
    name: 'AlertModal',
  });
</script>
<script setup lang="ts" name="AlertModal">
  import { ref, defineComponent, h } from 'vue';
  import { omit } from 'lodash-es';
  import { alertFormSchema, alertTypes } from './alert.data';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BasicForm, useForm } from '/@/components/Form';
  import { Form, Select, Input, Divider } from 'ant-design-vue';
  import { SvgIcon } from '/@/components/Icon';
  import { fetchAlertAdd, fetchAlertUpdate, fetchExistsAlert } from '/@/api/flink/setting/alert';
  import { useUserStore } from '/@/store/modules/user';
  import { useMessage } from '/@/hooks/web/useMessage';

  const FormItem = Form.Item;
  const SelectOption = Select.Option;
  const InputTextArea = Input.TextArea;

  const emit = defineEmits(['reload', 'register']);
  const alertId = ref<string | null>(null);
  const alertType = ref<string[]>([]);

  const { Swal } = useMessage();
  const userStore = useUserStore();
  const [registerForm, { validateFields, resetFields, setFieldsValue }] = useForm({
    labelWidth: 160,
    colon: true,
    showActionButtonGroup: false,
    baseColProps: { span: 24 },
    labelCol: { lg: 5, sm: 7 },
    wrapperCol: { lg: 16, sm: 4 },
    schemas: [
      {
        field: 'alertName',
        label: 'Alert Name',
        component: 'Input',
        componentProps: { allowClear: true, placeholder: 'Please enter alert name' },
        afterItem: h(
          'span',
          { class: 'conf-switch' },
          'the alert name, e.g: StreamPark team alert',
        ),
        dynamicRules: () => {
          return [
            {
              validator: async (_, value) => {
                if (value === null || value === undefined || value === '') {
                  return Promise.reject('Alert Name is required');
                } else {
                  if (!alertId.value) {
                    try {
                      const isExist = await fetchExistsAlert({ alertName: value });
                      if (isExist) {
                        return Promise.reject(
                          'Alert Name must be unique. The alert name already exists',
                        );
                      } else {
                        return Promise.resolve();
                      }
                    } catch (error) {
                      return Promise.reject('error happened ,caused by: ' + error);
                    }
                  }
                }
                return Promise.resolve();
              },
              required: true,
              trigger: 'blur',
            },
          ];
        },
      },
      ...alertFormSchema,
    ],
  });
  const [registerModal, { changeOkLoading, closeModal }] = useModalInner((data) => {
    resetFields();
    alertId.value = '';
    alertType.value = [];
    if (data && Object.keys(data).length > 0) {
      alertId.value = data.alertId;
      alertType.value = data.alertType;
      setFieldsValue(omit(data, 'alertId'));
    }
  });

  // Submit new settings
  async function handleSubmit() {
    try {
      changeOkLoading(true);
      const formValue = await validateFields();
      console.log('formValue', formValue);
      const param = {
        id: alertId.value,
        alertName: formValue.alertName,
        userId: userStore.getUserInfo?.userId,
        alertType: eval(formValue.alertType.join('+')),
        emailParams: { contacts: formValue.alertEmail },
        dingTalkParams: {
          token: formValue.dingtalkToken,
          contacts: formValue.alertDingUser,
          isAtAll: formValue.dingtalkIsAtAll,
          alertDingURL: formValue.alertDingURL,
          secretEnable: formValue.dingtalkSecretEnable,
          secretToken: formValue.dingtalkSecretToken,
        },
        weComParams: {
          token: formValue.weToken,
        },
        larkParams: {
          token: formValue.larkToken,
          isAtAll: formValue.larkIsAtAll,
          secretEnable: formValue.larkSecretEnable,
          secretToken: formValue.larkSecretToken,
        },
        isJsonType: true,
      };
      console.log('Update alarm parameters：' + JSON.stringify(param));

      // No id means new operation
      if (!param.id) {
        // Check if there is an alarm with the same name before submitting
        const isExist = await fetchExistsAlert({ alertName: param.alertName });
        if (isExist) {
          Swal.fire(
            'Failed create AlertConfig',
            'alertName ' + param.alertName + ' is already exists!',
            'error',
          );
        } else {
          const { data } = await fetchAlertAdd(param);
          if (!data.data) {
            Swal.fire(
              'Failed create AlertConfig',
              data['message'].replaceAll(/\[StreamPark]/g, ''),
              'error',
            );
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Create AlertConfig successful!',
              showConfirmButton: false,
              timer: 2000,
            });
          }
        }
      } else {
        //update
        const { data } = await fetchAlertUpdate(param);
        if (!data.data) {
          Swal.fire(
            'Failed update AlertConfig',
            data['message'].replaceAll(/\[StreamPark]/g, ''),
            'error',
          );
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Update AlertConfig successful!',
            showConfirmButton: false,
            timer: 2000,
          });
        }
      }
      closeModal();
      emit('reload');
    } catch (error) {
      console.error(error);
    } finally {
      changeOkLoading(false);
    }
  }
</script>

<template>
  <BasicModal ok-text="Submit" @register="registerModal" v-bind="$attrs" @ok="handleSubmit">
    <template #title>
      <SvgIcon name="alarm" size="25" />
      Alert Setting
    </template>
    <BasicForm @register="registerForm" class="!mt-15px">
      <template #type="{ model, field }">
        <Select
          v-model:value="model[field]"
          placeholder="Alert Type"
          allowClear
          mode="multiple"
          @change="(value:string[])=>alertType=value"
        >
          <SelectOption
            v-for="(v, k) in alertTypes"
            :key="`alertType_${k}`"
            :disabled="v.disabled"
            :value="k"
          >
            <SvgIcon :name="v.icon" />
            {{ v.name }}
          </SelectOption>
        </Select>
      </template>
      <template #alertEmail="{ model, field }">
        <!-- Alert Email -->
        <template v-if="(alertType || []).includes('1')">
          <Divider>
            <SvgIcon name="mail" size="20" />
            E-mail
          </Divider>
          <FormItem
            label="Alert Email"
            :rules="[
              { required: true, message: 'email address is required', trigger: 'blur' },
              { type: 'email', message: 'Incorrect format', trigger: 'blur' },
            ]"
            name="alertEmail"
          >
            <Input
              v-model:value="model[field]"
              placeholder="Please enter email,separate multiple emails with comma(,)"
            />
          </FormItem>
        </template>
      </template>

      <template #alertDingURL="{ model, field }" v-if="(alertType || []).includes('2')">
        <Divider>
          <SvgIcon name="dingtalk" size="20" />
          Ding Talk
        </Divider>
        <FormItem
          label="DingTalk Url"
          name="alertDingURL"
          :rules="[
            {
              pattern:
                /^((https?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/,
              message: 'Incorrect format',
              trigger: 'blur',
            },
          ]"
        >
          <Input v-model:value="model[field]" placeholder="Please enter DingTask Url" allowClear />
        </FormItem>
      </template>

      <!-- WeChat -->
      <template #weToken="{ model, field, schema }" v-if="(alertType || []).includes('4')">
        <Divider><SvgIcon name="wecom" size="20" /> WeChat </Divider>
        <FormItem :label="schema.label" :name="field" :rules="schema.rules">
          <InputTextArea v-model:value="model[field]" v-bind="schema.componentProps" />
        </FormItem>
      </template>

      <template #alertSms="{ model, field, schema }" v-if="(alertType || []).includes('8')">
        <Divider><SvgIcon name="message" size="20" /> SMS </Divider>
        <FormItem :label="schema.label" :name="field" :rules="schema.rules">
          <Input v-model:value="model[field]" v-bind="schema.componentProps" />
        </FormItem>
      </template>

      <!-- lark -->
      <template #larkToken="{ model, field, schema }" v-if="(alertType || []).includes('16')">
        <Divider><SvgIcon name="lark" size="20" /> Lark </Divider>
        <FormItem :label="schema.label" :name="field" :rules="schema.rules">
          <Input
            v-model:value="model[field]"
            placeholder="Please enter the access token of LarkTalk"
            allow-clear
          />
        </FormItem>
      </template>
    </BasicForm>
  </BasicModal>
</template>
