/*
 * @Description:
 * @Version: 2.0
 * @Autor: xiliang
 * @Date: 2021-06-10 13:58:48
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-06-28 10:52:40
 */
/* global Vue */

var apiURL = "https://api.github.com/repos/vuejs/vue/commits?per_page=3&sha=";


/**
 * Actual demo
 */
// debugger;
new Vue({
  el: "#demo",

  data: {
    childProps:'121221',
    branches: ["master", "dev"],
    currentBranch: "master",
    commits: null,
  },
  components:{
    // Child
  },

  created: function () {
    console.log(this)
    this.fetchData();
  },

  watch: {
    currentBranch: "fetchData",
  },

  filters: {
    truncate: function (v) {
      var newline = v.indexOf("\n");
      return newline > 0 ? v.slice(0, newline) : v;
    },
    formatDate: function (v) {
      return v.replace(/T|Z/g, " ");
    },
  },

  methods: {
    fetchData: function () {
      var self = this;
      if (navigator.userAgent.indexOf("PhantomJS") > -1) {
        // use mocks in e2e to avoid dependency on network / authentication
        setTimeout(function () {
          self.commits = window.MOCKS[self.currentBranch];
        }, 0);
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", apiURL + self.currentBranch);
        xhr.onload = function () {
          self.commits = JSON.parse(xhr.responseText);
          console.log(self.commits[0].html_url);
        };
        xhr.send();
      }
    },
  },
});
