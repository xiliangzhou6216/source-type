/*
 * @Description: 
 * @Version: 2.0
 * @Autor: xiliang
 * @Date: 2021-06-25 17:40:17
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-07-23 15:39:15
 */
/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

/**
 * 初始化全局的api
 * 
 * @param {*} Vue 
 */
export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  // Vue的默认全局配置项
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 暴露一些工具方法
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  // 响应式方法
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }

  //</T> 

  Vue.options = Object.create(null)
  
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.

  // 将 Vue 构造函数挂载到 Vue.options._base 上
  Vue.options._base = Vue

  // </T>在Vue.options.components上添加 KeepAlive
  extend(Vue.options.components, builtInComponents)
  // Vue.use
  initUse(Vue)
  // Vue.mixin
  initMixin(Vue)
  // Vue.extend
  initExtend(Vue)
  // Vue.component/directive/filter
  initAssetRegisters(Vue)
  
}
