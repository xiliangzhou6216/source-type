/* @flow */

import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  invokeWithErrorHandling,
  noop
} from '../util/index'

import { traverse } from './traverse'
import { queueWatcher } from './scheduler'
import Dep, { pushTarget, popTarget } from './dep'

import type { SimpleSet } from '../util/index'

let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */


// 数据更新时 watcher会被触发,访问计算属性或者$watch()也会被触发watcher
// 一个组件一个 watcher 这个不理解

export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
  
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
    //expOrFn 可能是字符串  
    // this.getter=function (){ return this.xx }
    // 在 this.get 中执行 this.getter 时会触发依赖收集
    // 如果后续this.xx更新时,就会触发响应式
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */

  // 重新依赖收集,
  get () {
    // Dep.target=this
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      // 执行watcher实例取值方法的时候会触发key的getter方法,进行依赖收集

      // 1. 实例化一个组件时,会调用new Watcher()实例化一个渲染 watcher,然后会调用 watcher.get() 方法 接着就会实例化watcher时传递的updateComponent方法，
      // 然后就会先执行vm._render()函数,生成VNode,在生成组件VNode的过程中就会有读取操作,这时候就可以进行依赖收集
      // 2. watch选项
      // 3. computed选项
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      //关闭 Dep.target Dep.target=null
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   */

   /**
    * 1.添加dep到自己(watcher)
    * 2.添加自己(watcher)到dep 
    * @param {*} dep 
    */
  addDep (dep: Dep) {
    //判重 如果dep.id有的话 则不重复添加
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      // 缓存dep.id 判重
      this.newDepIds.add(id)
      // 添加dep
      // debugger
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        //添加自己(watcher)到dep 
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * 依赖改变
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      // 同步执行
      // 在使用 vm.$watch 或者 watch 选项时可以传一个 sync 选项，
      // 当为true时,watcher就不走异步更行了,就直接走this.run方法
      // 这个属性官方文档没有出现
      this.run()
    } else {
      // 更新时一般都这里，将 watcher 放入 watcher 队列
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  // 刷新队列函数
  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        // 如果是用户 watcher
        if (this.user) {
          const info = `callback for watcher "${this.expression}"`
          // 执行this.cb回调函数
          invokeWithErrorHandling(this.cb, this.vm, [value, oldValue], this.vm, info)
        } else {
          console.log(9999999999)
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */

  /**
   * 懒执行的 watcher 会调用该方法
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  // 访问计算属性调用
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */

  // unwatch 时移除相关依赖 主动取校监听情况
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
