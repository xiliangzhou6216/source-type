/* @flow */

import { hasOwn } from 'shared/util'
import { warn, hasSymbol } from '../util/index'
import { defineReactive, toggleObserving } from '../observer/index'


/**
 * 解析组件配置项的provide对象，挂载到vm._provided属性上
 * @param {*} vm 实例
 */
export function initProvide (vm: Component) {
  const provide = vm.$options.provide
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide
  }
}

/**
 * 
 * 初始化inject配置项
 * 1. 得到result[key]=val
 * 2. 对结构数据进行响应式处理，代理每个 key 到 vm 实例 
 *  
 * 祖代像所有子代组件透传数据
 * 
 */
export function initInjections (vm: Component) {
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    toggleObserving(false)
    // 解析结果作响应式处理，将key代理到实例上，在组件里可以通过this.key来进行访问
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}

/**
 * 解析 inject 配置项，从祖代组件的 provide 配置中找到 key 对应的值，否则用 默认值，最后得到 result[key] = val
 * inject 对象肯定是以下这个结构
 * @param {*} inject={
 *  key:{
 *    from:provideKey
 *    default:xx||fn 
 *   }
 * } 
 * @param {*} vm 
 * @returns 
 */
export function resolveInject (inject: any, vm: Component): ?Object {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    const result = Object.create(null)
    const keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject)

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      // #6574 in case the inject object is observed...
      if (key === '__ob__') continue
      const provideKey = inject[key].from
      let source = vm
      // 遍历所有的祖代组件，直到根组件，找到provide中对应的key的值，最后得到 result[key] = val
      while (source) {
        // 第一次循环是去当前组件实例上拿 _provided 选项
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey]
          break
        }
        source = source.$parent
      }
      // 如果上一个循环没有的话 ，则采用默认值inject[key].default
      if (!source) {
        if ('default' in inject[key]) {
          const provideDefault = inject[key].default
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault
        } else if (process.env.NODE_ENV !== 'production') {
          warn(`Injection "${key}" not found`, vm)
        }
      }
    }
    return result
  }
}
