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

<template>
  <div :class="['container-wrapper', device]">
    <div class="container">
      <div class="main">
        <div class="top">
          <div class="header">
            <a href="/">
              <img
                src="~@/assets/imgs/logo.svg"
                class="logo"
                alt="logo">
            </a>
          </div>
          <div class="desc">
            StreamPark ── Make stream processing easier!
          </div>
        </div>
        <a-form
          id="formLogin"
          class="signin-form"
          ref="formLogin"
          :form="form"
          @submit="handleSubmit">
          <a-form-item>
            <a-input
              size="large"
              type="text"
              placeholder="username / admin"
              v-decorator="[
                'username',
                {rules: [{ required: true, message: 'please enter username' }], validateTrigger: 'change'}
              ]">
              <a-icon
                slot="prefix"
                type="user"
                class="icon"/>
            </a-input>
          </a-form-item>

          <a-form-item>
            <a-input
              size="large"
              type="password"
              autocomplete="false"
              placeholder="password / streampark"
              v-decorator="[
                'password',
                {rules: [{ required: true, message: 'please enter password' }], validateTrigger: 'blur'}
              ]">
              <a-icon
                slot="prefix"
                type="lock"
                class="icon"/>
            </a-input>
          </a-form-item>

          <a-form-item
            style="margin-top:40px">
            <a-button
              size="large"
              type="primary"
              html-type="submit"
              class="signin-button"
              :loading="state.loginBtn"
              :disabled="state.loginBtn">
              Sign in
            </a-button>
          </a-form-item>
        <a-form-item
          style="margin-top:40px">
          <a-button
            style="padding: 0 90px"
            size="large"
            type="primary"
            html-type="button"
            class="signin-button"
            @click="login"
            :loading="state.loginBtn"
            :disabled="state.loginBtn">
            Sign in with casdoor
          </a-button>
        </a-form-item>
      </a-form>

      </div>

      <div class="footer">
        <div class="links">
          <a href="_self">help</a>
          <a href="_self">privacy</a>
          <a href="_self">provision</a>
        </div>
        <div
          class="copyright">
          Copyright &copy; 2015~{{ year }} benjobs
        </div>
      </div>
    </div>
    <vue-particles
      color="#dedede"
      :particle-opacity="0.7"
      :particles-number="80"
      shape-type="circle"
      :particle-size="4"
      lines-color="#dedede"
      :lines-width="1"
      :line-linked="true"
      :line-opacity="0.4"
      :lines-distance="150"
      :move-speed="5"
      :hover-effect="true"
      hover-mode="grab"
      :click-effect="true"
      click-mode="push"/>

    <a-modal
      v-model="teamVisible"
      on-ok="handleTeamOk">
      <template
        slot="title">
        <a-icon
          slot="icon"
          type="setting"
          style="color: green"/>
        Select Team
      </template>

      <a-form
        :form="teamForm"
        @submit="handleTeamOk">
        <a-form-item
          label="Please select a team">
          <a-select
            v-decorator="['teamId',{ rules: [{ required: true } ]}]">
            <a-select-option
              v-for="t in teamList"
              :value="t.id"
              :key="`sign_team_`.concat(t.id)">
              {{ t.teamName }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>

      <template slot="footer">
        <a-button
          key="back"
          @click="handleTeamCancel">
          Cancel
        </a-button>
        <a-button
          key="submit"
          type="primary"
          @click="handleTeamOk">
          Submit
        </a-button>
      </template>
    </a-modal>

  </div>
</template>

<script type="application/ecmascript">
import {mapActions} from 'vuex'
import {mixinDevice} from '@/utils/mixin'
import {teams} from '@/api/member'

export default {
  mixins: [mixinDevice],
  data() {
    return {
      loginBtn: false,
      form: this.$form.createForm(this),
      teamForm: this.$form.createForm(this),
      state: {
        time: 60,
        loginBtn: false
      },
      c_data:{
        c_code:'',
        c_state:''
      },
      loginInfo: {},
      teamList: [],
      teamId: null,
      userId: null,
      teamVisible: false,
      year: new Date().getFullYear()
    }
  },

  watch: {
    $route: {
      handler: function(route) {
      const {
        state,
        SignInByCasdoor
      }=this
      const url = window.document.location.href
      const u = new URL(url)
      this.c_data.c_code = u.searchParams.get('code')
      this.c_data.c_state = u.searchParams.get('state')
      if(this.c_data.c_code!=null&&this.c_data.c_state!=null){
      SignInByCasdoor({
        code : this.c_data.c_code ,
        state : this.c_data.c_state
      })
      .then(resp => {
            if (resp.code != null) {
              const message = 'SignIn failed,' + (resp.code === 0 ? ' authentication error' : ' current User is locked.')
               this.$message.error(message)
            } else {
              this.$router.push({path: '/'})
            }
           })
          .catch(err => console.log(err))
          .finally(() => {
            state.loginBtn = false
          })
      }
      },
      immediate: true
    }

  },

  mounted() {
    const index = this.randomNum(1, 4)
    $('.main').css({
      'background': index > 2 ? 'rgba(122, 200, 255, .2)' : 'rgba(0, 0, 0, .2)'
    })
    const bgUrl = require('@assets/bg/' + index + '.png')
    $('#particles-js').css('background-image', 'url(' + bgUrl + ')')
  },

  methods: {

    ...mapActions(['SignIn', 'SetTeam','SignInByCasdoor']),

    handleSubmit() {
      arguments[0] && arguments[0].preventDefault()
      const {
        form: { validateFields },
        state,
        SignIn
      } = this
      state.loginBtn = true
      const validateFieldsKey = ['username', 'password']
      validateFields(validateFieldsKey, {force: true}, (err, values) => {
        if (!err) {
          const loginParams = {...values}
          SignIn(loginParams)
            .then(() => {
              this.$router.push({path: '/flink/app'})
            }).catch(resp => {
              const code = resp.code
              if (code != null && code != undefined) {
                if (code == 0 || code == 1) {
                  const message = 'SignIn failed,' + (resp.code === 0 ? ' authentication error' : ' current User is locked.')
                  this.$message.error(message)
                } else if (resp.code == 403) {
                  this.loginInfo = values
                  this.teamVisible = true
                  this.userId = resp.data
                  teams({
                    userId: this.userId
                  }).then((r) => {
                    this.teamList = r.data
                  })
                } else {
                  console.log(resp)
                }
              }
          }).finally(() => {
              state.loginBtn = false
          })
        } else {
          setTimeout(() => {
            state.loginBtn = false
          }, 600)
        }
      })
    },

    handleTeamOk(e) {
      e.preventDefault()
      const {teamForm: { validateFields }} = this
      validateFields(['teamId'], {force: true}, (err, values) => {
        if (!err) {
          this.SetTeam({
            teamId: values.teamId,
            userId: this.userId
          }).then((resp) => {
            this.handleSubmit()
          })
        }
      })
    },

    handleTeamCancel() {
      this.teamVisible = false
    },

    login() {
      window.location.href = this.getSigninUrl()
    }
    
  }
}
</script>
<style lang="less">
@import "SignIn";
</style>
