/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { RenderCallbackParams } from '/@/components/Form/src/types/form';
import { Icon, SvgIcon } from '/@/components/Icon';
import options from '../data/option';

import Mergely from '../components/Mergely.vue';
import CustomForm from '../components/customForm';
import {
  Alert,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Menu,
  Select,
  Switch,
  Tag,
} from 'ant-design-vue';
import { Button } from '/@/components/Button';
import { descriptionFilter } from '../utils';
import { SettingTwoTone } from '@ant-design/icons-vue';
import { ref, unref } from 'vue';
import { handleConfTemplate } from '/@/api/flink/config';
import { decodeByBase64 } from '/@/utils/cipher';
import { useMessage } from '/@/hooks/web/useMessage';

/* render input dropdown component */
export const renderInputDropdown = (
  formModel: Recordable,
  field: string,
  componentProps: { placeholder: string; options: Array<string> },
) => {
  return (
    <Input
      type="text"
      placeholder={componentProps.placeholder}
      allowClear
      value={formModel[field]}
      onInput={(e) => (formModel[field] = e.target.value)}
    >
      {{
        addonAfter: () => (
          <Dropdown placement="bottomRight">
            {{
              overlay: () => (
                <div>
                  <Menu trigger="['click', 'hover']">
                    {componentProps.options.map((item) => {
                      return (
                        <Menu.Item
                          key={item}
                          onClick={() => (formModel[field] = item)}
                          class="pr-60px"
                        >
                          <Icon icon="ant-design:plus-circle-outlined" />
                          {{ item }}
                        </Menu.Item>
                      );
                    })}
                  </Menu>
                  <Icon icon="ant-design:history-outlined" />
                </div>
              ),
            }}
          </Dropdown>
        ),
      }}
    </Input>
  );
};

export function handleCheckCheckpoint(values: Recordable) {
  const { cpMaxFailureInterval, cpFailureRateInterval, cpFailureAction } = values.checkPointFailure;
  if (cpMaxFailureInterval != null && cpFailureRateInterval != null && cpFailureAction != null) {
    if (cpFailureAction === 1) {
      if (values.alertId == null) {
        // this.form.setFields({
        //   alertEmail: {
        //     errors: [new Error('checkPoint failure trigger is alert,email must not be empty')],
        //   },
        // });
        return Promise.reject('trigger action is alert,Fault Alert Template must not be empty');
      } else {
        return Promise.resolve();
      }
    } else {
      return Promise.resolve();
    }
  } else if (
    cpMaxFailureInterval == null &&
    cpFailureRateInterval == null &&
    cpFailureAction == null
  ) {
    return Promise.resolve();
  } else {
    return Promise.reject('options all required or all empty');
  }
}

/* render input Group component */
export const renderInputGroup = ({ model }) => {
  if (!Reflect.has(model, 'checkPointFailure')) {
    model.checkPointFailure = {};
  }
  const handleUpdate = (value: any) => {
    Object.assign(model, {
      checkPointFailure: value,
    });
  };
  return (
    <Form.Item
      label="CheckPoint Failure Options"
      name="checkPointFailure"
      rules={[{ validator: () => handleCheckCheckpoint(model) }]}
    >
      <CustomForm
        value={{
          cpMaxFailureInterval: model.checkPointFailure.cpMaxFailureInterval,
          cpFailureRateInterval: model.checkPointFailure.cpFailureRateInterval,
          cpFailureAction: model.checkPointFailure.cpFailureAction,
        }}
        onUpdateValue={handleUpdate}
      ></CustomForm>
    </Form.Item>
  );
};
/*Gets the selection of totalOptions */
function getTotalOptions() {
  return [
    {
      name: 'process memory(进程总内存)',
      options: options.filter((x) => x.group === 'process-memory'),
    },
    {
      name: 'total memory(Flink 总内存)',
      options: options.filter((x) => x.group === 'total-memory'),
    },
  ];
}
/* render total memory component */
export const renderTotalMemory = ({ model, field }: RenderCallbackParams) => {
  return (
    <div>
      <Select
        show-search
        allow-clear
        mode="multiple"
        max-tag-count={2}
        options={getTotalOptions()}
        field-names={{ label: 'name', value: 'key', options: 'options' }}
        value={model[field]}
        onChange={(value) => (model[field] = value)}
        placeholder="Please select the resource parameters to set"
      />
      <p class="conf-desc mt-10px">
        <span class="note-info">
          <Tag color="#2db7f5" class="tag-note">
            Note
          </Tag>
          <span>Explicitly configuring both</span>
          <span class="note-elem">total process memory</span> and
          <span class="note-elem">total Flink memory</span> is not recommended. It may lead to
          deployment failures due to potential memory configuration conflicts. Configuring other
          memory components also requires caution as it can produce further configuration conflicts,
          The easiest way is to set <span class="note-elem">total process memory</span>
        </span>
      </p>
    </div>
  );
};

function hasOptions(items) {
  return options.filter((x) => items.includes(x.key)) as any;
}
/* render memory option */
export const renderOptionsItems = (
  model: Recordable,
  parentField: string,
  field: string,
  reg: string,
  replace = false,
) => {
  return hasOptions(model[parentField] || []).map((conf: Recordable) => {
    let label = conf.name.replace(new RegExp(reg, 'g'), '');
    if (replace) label = label.replace(/\./g, ' ');
    if (!Reflect.has(model, field)) {
      model[field] = {};
    }
    if (!model[field][conf.key]) {
      model[field][conf.key] = conf.defaultValue || null;
    }
    if (!Reflect.has(model, conf.key)) {
      model[conf.key] = model[field][conf.key] || conf.defaultValue || null;
    }

    function handleValueChange(value: string) {
      model[conf.key] = value;
      model[field][conf.key] = value;
    }
    return (
      <Form.Item label={label} name={conf.key} key={`${field}.${conf.key}`}>
        {conf.type === 'number' && (
          <InputNumber
            class="!w-full"
            min={conf.min}
            max={conf.max}
            step={conf.step}
            value={model[field][conf.key]}
            onChange={handleValueChange}
            rules={[{ validator: conf.validator }]}
          />
        )}
        {conf.type === 'switch' && <span class="conf-switch">({conf.placeholder})</span>}
        <p class="conf-desc"> {descriptionFilter(conf)} </p>
      </Form.Item>
    );
  });
};

/* render memory option */
export const renderProperties = ({ model, field }: RenderCallbackParams) => {
  return (
    <div>
      <Input.TextArea
        rows={8}
        name="properties"
        placeholder="$key=$value,If there are multiple parameters,you can new line enter them (-D <arg>)"
        value={model[field]}
        onInput={(e: ChangeEvent) => (model[field] = e?.target?.value)}
      />
      <p class="conf-desc mt-10px">
        <span class="note-info">
          <Tag color="#2db7f5" class="tag-note">
            Note
          </Tag>
          It works the same as <span class="note-elem">-D$property=$value</span> in CLI mode, Allows
          specifying multiple generic configuration options. The available options can be found
          <a
            href="https://ci.apache.org/projects/flink/flink-docs-stable/ops/config.html"
            target="_blank"
            class="pl-5px"
          >
            here
          </a>
        </span>
      </p>
    </div>
  );
};

export const getAlertSvgIcon = (name: string, text: string) => {
  return (
    <Alert type="info">
      {{
        message: () => (
          <div>
            <SvgIcon class="mr-8px" name={name} style={{ color: '#108ee9' }} />
            <span>{text}</span>
          </div>
        ),
      }}
    </Alert>
  );
};
/* render application conf */
export const renderIsSetConfig = (
  model: Recordable,
  field: string,
  registerConfDrawer: Fn,
  openConfDrawer: Fn,
) => {
  /* Open the sqlConf drawer */
  async function handleSQLConf(checked: boolean) {
    if (checked) {
      if (unref(model.configOverride) != null) {
        openConfDrawer(true, {
          configOverride: unref(model.configOverride),
        });
      } else {
        const res = await handleConfTemplate();
        openConfDrawer(true, {
          configOverride: decodeByBase64(res),
        });
      }
    } else {
      openConfDrawer(false);
      Object.assign(model, {
        configOverride: null,
        isSetConfig: false,
      });
    }
  }
  function handleEditConfClose() {
    if (!model.configOverride) {
      model.isSetConfig = false;
    }
  }
  function handleMergeSubmit(data: { configOverride: string; isSetConfig: boolean }) {
    if (data.configOverride == null || !data.configOverride.replace(/^\s+|\s+$/gm, '')) {
      Object.assign(model, {
        configOverride: null,
        isSetConfig: false,
      });
    } else {
      Object.assign(model, {
        configOverride: data.configOverride,
        isSetConfig: true,
      });
    }
  }
  return (
    <div>
      <Switch
        checked-children="ON"
        un-checked-children="OFF"
        checked={model[field]}
        onChange={(checked) => (model[field] = checked)}
      />
      {model[field] && (
        <SettingTwoTone
          class="ml-10px"
          theme="twoTone"
          two-tone-color="#4a9ff5"
          onClick={() => handleSQLConf(true)}
        />
      )}

      <Mergely
        onOk={handleMergeSubmit}
        onClose={() => handleEditConfClose()}
        onRegister={registerConfDrawer}
      />
    </div>
  );
};

export const renderSqlHistory = (
  { model, flinkSqlHistory },
  { handleChangeSQL, handleCompareOk }: { handleChangeSQL: Fn; handleCompareOk: Fn },
) => {
  const { createConfirm } = useMessage();
  const compareSQL = ref<string[]>([]);

  function handleSelectChange(value) {
    model.sqlId = value;
    handleChangeSQL(value);
  }

  function handleCompactSQL() {
    createConfirm({
      iconType: 'info',
      title: () => (
        <div>
          <Icon icon="ant-design:swap-outlined" style="color: #4a9ff5" />
          <span>Compare Flink SQL</span>
        </div>
      ),
      content: () => {
        return (
          <Form>
            <Form.Item
              label="Version"
              label-col={{ lg: { span: 5 }, sm: { span: 7 } }}
              wrapper-col={{ lg: { span: 16 }, sm: { span: 17 } }}
            >
              <Select
                placeholder="Please select the sql version to compare"
                value={unref(compareSQL)}
                onChange={(value: any) => (compareSQL.value = value)}
                mode="multiple"
                maxTagCount={2}
              >
                {renderSelectOptions()}
              </Select>
            </Form.Item>
          </Form>
        );
      },
      onOk: handleCompareOk.bind(null, compareSQL.value),
    });
  }

  const renderSelectOptions = async (isCompareSelect = false) => {
    const isDisabled = (ver) => {
      if (!isCompareSelect) return false;
      return compareSQL.value.length == 2 && compareSQL.value.findIndex((i) => i === ver.id) === -1;
    };
    return (flinkSqlHistory || []).map((ver) => {
      return (
        <Select.Option key={ver.id} disabled={isDisabled(ver)}>
          <div>
            <Button type="primary" shape="circle" size="small">
              {ver.version}
            </Button>
            {ver.effective && (
              <Tag color="green" style=";margin-left: 5px;" size="small">
                Effective
              </Tag>
            )}

            {[1, 2].includes(ver.candidate) && (
              <Tag color="cyan" style=";margin-left: 5px;" size="small">
                Candidate
              </Tag>
            )}
          </div>
        </Select.Option>
      );
    });
  };

  return (
    <div>
      <Select
        onChange={(value) => handleSelectChange(value)}
        value={model.sqlId}
        style="width: calc(100% - 60px)"
      >
        {renderSelectOptions()}
      </Select>
      <Button type="primary" class="ml-10px w-50px" onClick={() => handleCompactSQL()}>
        <Icon icon="ant-design:swap-outlined" />
      </Button>
    </div>
  );
};

export const renderCompareSelectTag = (ver: any) => {
  return (
    <div>
      <Button type="primary" shape="circle" size="small">
        {ver.version}
      </Button>
      {ver.effective && (
        <Tag color="green" style=";margin-left: 5px;" size="small">
          Effective
        </Tag>
      )}

      {[1, 2].includes(ver.candidate) && (
        <Tag color="cyan" style=";margin-left: 5px;" size="small">
          Candidate
        </Tag>
      )}
    </div>
  );
};

export const renderResourceFrom = (model: Recordable) => {
  return (
    <Select
      onChange={(value: string) => (model.resourceFrom = value)}
      value={model.resourceFrom}
      placeholder="Please select resource from"
    >
      <Select.Option value="csv">
        <SvgIcon name="github" />
        <span class="pl-10px">CICD</span>
        <span class="gray">(build from CVS)</span>
      </Select.Option>
      <Select.Option value="upload">
        <SvgIcon name="upload" />
        <span class="pl-10px">Upload</span>
        <span class="gray">(upload local job)</span>
      </Select.Option>
    </Select>
  );
};
