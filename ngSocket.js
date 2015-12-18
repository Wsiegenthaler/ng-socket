/*
 * ngSocket.js
 * https://github.com/chrisenytc/ng-socket
 *
 * Copyright (c) 2013 Christopher EnyTC, David Prothero
 * Licensed under the MIT license.
 */

// Module Copyright (c) 2013 Michael Benford

// Module for provide Socket.io support

(function () {
  'use strict';

  angular.module('ngSocket', [])
    .provider('$socket', socketProvider);

  function socketProvider() {
    var url, options = {};

    this.setUrl = setUrl;
    this.getUrl = getUrl;
    this.setOptions = setOptions;
    this.getOptions = getOptions;
    this.$get = ['$rootScope', socketFactory];

    function setUrl(value) {
      url = value;
    }

    function getUrl() {
      return url;
    }

    function setOptions(value) {
      options = value;
    }

    function getOptions() {
      return options;
    }

    function socketFactory($rootScope) {
      var socket;

      var service = {
        addListener: addListener,
        removeListener: removeListener,
        on: ngAddListener,
        once: ngAddListenerOnce,
        removeAllListeners: removeAllListeners,
        emit: emit,
        getSocket: getSocket,

        /*
         * By default ng-socket triggers a digest-cycle on the $rootScope for every message handled. 
         * However convenient this practice can lead to performance issues. This part of the api 
         * provides versions of the standard addListener/on/once handlers which delegate Angular 
         * digest/apply concerns to the callback.
         */
        plain: {
          addListener: addListener,
          on: addListener,
          once: addListenerOnce,
          removeListener: removeListener,
        }
      };

      return service;
      ////////////////////////////////

      function initializeSocket() {
        //Check if socket is undefined
        if (typeof socket === 'undefined') {
          if (url !== 'undefined') {
            socket = io.connect(url, options);
          } else {
            socket = io.connect(options);
          }
        }
      }

      function angularCallback(callback) {
        return function () {
          if (callback) {
            var args = arguments;
            $rootScope.$apply(function () {
              callback.apply(socket, args);
            });
          }
        };
      }

      function ngAddListener(name, scope, callback) {
        if (arguments.length === 2) {
          scope = null;
          callback = arguments[1];
        }

        addListener(name, scope, angularCallback(callback));
      }

      function addListener(name, scope, callback) {
        initializeSocket();

        if (arguments.length === 2) {
          scope = null;
          callback = arguments[1];
        }

        socket.on(name, callback);

        if (scope !== null) {
          scope.$on('$destroy', function () {
            socket.removeListener(name, callback);
          });
        }
      }

      function ngAddListenerOnce(name, callback) {
        addListenerOnce(name, angularCallback(callback));
      }

      function addListenerOnce(name, callback) {
        initializeSocket();
        socket.once(name, callback);
      }

      function removeListener(name, callback) {
        initializeSocket();
        socket.removeListener(name, callback);
      }

      function removeAllListeners(name) {
        initializeSocket();
        socket.removeAllListeners(name);
      }
      
      function emit(name) {
        initializeSocket();
        var callback = arguments[arguments.length -1];
        if ("function" === typeof callback) {
          arguments[arguments.length -1] = angularCallback(callback); 
        }
        socket.emit.apply(socket, arguments);
      }
      
      function getSocket() {
        return socket;
      }
    }
  }

})();
