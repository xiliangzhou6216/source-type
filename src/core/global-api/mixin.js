/*
 * @Description: 
 * @Version: 2.0
 * @Autor: xiliang
 * @Date: 2021-06-25 17:40:17
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-07-23 15:49:26
 */
/* @flow */

import { mergeOptions } from '../util/index'

// 全局混入mixin  mixin会在调用组件自身的钩子之前调用
export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
