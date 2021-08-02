/* @flow */
import config from "../config";
import { initProxy } from "./proxy";
import { initState } from "./state";
import { initRender } from "./render";
import { initEvents } from "./events";
import { mark, measure } from "../util/perf";
import { initLifecycle, callHook } from "./lifecycle";
import { initProvide, initInjections } from "./inject";
import { extend, mergeOptions, formatComponentName } from "../util/index";

let uid = 0;

// /**
//  * @description: 定义 Vue.prototype._init 方法
//  * @param {*} Vue 构造函数
//  * @return {*}
//  * @author: xiliang
//  */

export function initMixin(Vue: Class<Component>) {
  // 负责Vue初始化的过程
  Vue.prototype._init = function (options?: Object) {
    // 负责Vue实例
    const vm: Component = this;
    // a uid
    vm._uid = uid++;

    // a flag to avoid this being observed
    vm._isVue = true;
    // 处理组件配置项
    // merge options
    if (options && options._isComponent) {
      // debugger
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.

      /**
       * 子组件：性能优化，
       * 将组件配置对象上的一些深层次属性放到 vm.$options 选项中，以提高代码的执行效率
       *
       */
      initInternalComponent(vm, options);
    } else {
      /**
       * 初始化根组件时会走这里，将全局配置选项合并在根组件的局部配置上
       *
       * 
       * 至于每个子组件的选项合并则发生在两个地方：
       * 1. Vue.component用户注册的全局组件和自身内置组件都会合并根实例components 上
       * 2. 子组件 componnents:{ xx } 局部注册，执行编译器生成的render函数 进行选项合并
       * 
       */
      //  debugger
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== "production") {
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }
    // expose real self
    vm._self = vm;

    // 初始化组件实例的关系属性 $parent $root
    initLifecycle(vm);
    // 自定义事件  一个组件上事件的派发和监听都是子组件 emit on
    initEvents(vm);
    // 解析组件的插槽信息，处理渲染函数， vm.$createElement方法 即h函数
    initRender(vm);
    // 调用beforeCreate钩子函数
    callHook(vm, "beforeCreate");
    // 初始化组件inject配置项，得到result[key]=val,然后对结果进行响应式处理，并且代理每个key到vm实例上
    initInjections(vm); // resolve injections before data/props
    // 数据响应式 处理 props、methods、data、computed、watch
    initState(vm);
    // 解析组件配置项的provide对象，将其挂载到vm._provide属性上
    initProvide(vm); // resolve provide after data/props
    // 调用 created钩子函数
    callHook(vm, "created");

    // 配置项有el选项，则自动调用$mount方法，没有就自己调用$mount
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}

// 性能优化，打平配置对象的属性，减少运行时原型链的查找，提高执行效率
export function initInternalComponent(
  vm: Component,
  options: InternalComponentOptions
) {

  // 基于构造函数上的配置选项创建vm.$options
  const opts = (vm.$options = Object.create(vm.constructor.options));
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;

  const vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  // 有render函数，将其赋值到vm.$options
  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}

// 从造函数中解析配置对象options，并合并基类选项
export function resolveConstructorOptions(Ctor: Class<Component>) {
  // 从实例构造函数上获取选项
  let options = Ctor.options;
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super);
    // 缓存
    const cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      //
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options;
}

function resolveModifiedOptions(Ctor: Class<Component>): ?Object {
  let modified;
  const latest = Ctor.options;
  const sealed = Ctor.sealedOptions;
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {};
      modified[key] = latest[key];
    }
  }
  return modified;
}
