/*
 * @Description:
 * @Version: 2.0
 * @Autor: xiliang
 * @Date: 2021-06-10 13:58:48
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-06-24 11:21:10
 */
import { initMixin } from "./init";
import { stateMixin } from "./state";
import { renderMixin } from "./render";
import { eventsMixin } from "./events";
import { lifecycleMixin } from "./lifecycle";
import { warn } from "../util/index";

// Vue构造函数
function Vue(options) {
  //Vue.prototype._init方法
  this._init(options);
}

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

export default Vue;
