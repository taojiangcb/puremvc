/**
 * Facade是与核心层（Model,View,Controller）进行通信的唯一接口，
 * 目的是简化开发复杂度。实际编码过程中，不需要手动实现这三类文件，
 * Facade类在构造方法中已经包含了对这三类单例的构造
 */
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Facade = /** @class */ (function () {
    function Facade() {
        this._view = new View();
        this._controller = new Controlller();
        this._model = new Model();
        this._obseverHash = {};
    }
    Facade.getInstance = function () {
        return this._instance || (this._instance = new Facade());
    };
    /**
     * 注册显示管理对象
     * @param mediator
     */
    Facade.prototype.registMediator = function (mediator) {
        this._view.regist(mediator);
    };
    Facade.prototype.removeMediator = function (name) {
        return this._view.remove(name);
    };
    Facade.prototype.getMediator = function (name) {
        return this._view.getMediator(name);
    };
    Facade.prototype.registCommand = function (cmd, cmdCls) {
        this._controller.regist(cmd, cmdCls);
    };
    Facade.prototype.removeCommand = function (cmd) {
        this._controller.remove(cmd);
    };
    Facade.prototype.hasCommand = function (cmd) {
        return this._controller.has(cmd);
    };
    Facade.prototype.registProxy = function (proxy) {
        this._model.regist(proxy);
        return proxy;
    };
    Facade.prototype.removeProxy = function (name) {
        return this._model.remove(name);
    };
    Facade.prototype.getProxy = function (name) {
        return this._model.getProxy(name);
    };
    Facade.prototype.sendNotification = function (name, body, type) {
        var notification = new Notification(name, body, type);
        this.executeObsever(notification);
        this._controller.executeCommend(notification);
    };
    Facade.prototype.registerObserver = function (notificationName, observer) {
        var observers = this._obseverHash[notificationName];
        if (observers)
            observers.push(observer);
        else
            this._obseverHash[notificationName] = [observer];
    };
    //移除注册执行对象，这里默认一个命令对应同一个对象只可能存在一个执行method，不然存在移除错误目标的bug
    Facade.prototype.removeObserver = function (notificationName, notifyContext) {
        var observers = this._obseverHash[notificationName];
        var i = observers.length;
        while (i--) {
            var observer = observers[i];
            if (observer.compareNotifyContext(notifyContext)) {
                observers.splice(i, 1);
                observer.release();
                break;
            }
        }
        if (observers.length == 0)
            delete this._obseverHash[notificationName];
    };
    Facade.prototype.executeObsever = function (notification) {
        var notificationName = notification.name;
        var observersRef = this._obseverHash[notificationName];
        if (observersRef) {
            var observers = observersRef.concat();
            var len = observers.length;
            for (var i = 0; i < len; i++) {
                var observer = observers[i];
                observer.execute(notification);
            }
        }
    };
    return Facade;
}());
exports.Facade = Facade;
/**
 * View 保存对 Mediator 对象的引用。由 Mediator 对象来操作具体的视图组件（
 * View Component，它的作用还包括：添加事件监听器，发送或接收 Notification，
 * 直接改变视图组件的状态。通过这样，就可以把视图和控制它的逻辑分离开来。
 */
var View = /** @class */ (function () {
    function View() {
        this._mediatorHash = {};
    }
    /**
     * 注册中间媒介
         * @param md
     */
    View.prototype.regist = function (md) {
        if (this._mediatorHash[md.name]) {
            console.error("重复注册mediator:" + md.name);
            return;
        }
        var facade = Facade.getInstance();
        this._mediatorHash[md.name] = md;
        var cmds = md.listNotificationInterests;
        var len = cmds.length;
        for (var i = 0; i < len; i++) {
            facade.registerObserver(cmds[i], Observer.create(md.execute, md));
        }
        md.onRegist();
    };
    View.prototype.remove = function (name) {
        var mediator = this._mediatorHash[name];
        if (!mediator)
            return null;
        var cmds = mediator.listNotificationInterests;
        var len = cmds.length;
        var facade = Facade.getInstance();
        for (var i = 0; i < len; i++) {
            facade.removeObserver(cmds[i], mediator);
        }
        delete this._mediatorHash[name];
        mediator.onRemove();
        return mediator;
    };
    View.prototype.getMediator = function (name) {
        return this._mediatorHash[name];
    };
    return View;
}());
/**
 * Controller与Command Command（模式），是一种行为设计模式，
 * 这种模式下所有动作或者行为所需信息被封装到一个对象之内。Command模式解耦了发送者与接收者之间的联系。
 * 在PureMVC中，Controller保存了所有Command的映射。Command是无状态且惰性的，只有在需要的时候才被创建。
 */
var Controlller = /** @class */ (function () {
    function Controlller() {
        this._commondHash = {};
    }
    Controlller.prototype.regist = function (cmd, cmdCls) {
        if (this._commondHash[cmd]) {
            console.error("重复注册Controller:" + cmd);
            return;
        }
        this._commondHash[cmd] = cmdCls;
    };
    Controlller.prototype.remove = function (cmd) {
        delete this._commondHash[cmd];
    };
    Controlller.prototype.has = function (cmd) {
        return this._commondHash[cmd] != null;
    };
    Controlller.prototype.executeCommend = function (notification) {
        var cmdCls = this._commondHash[notification.name];
        if (!cmdCls)
            return;
        var command = new cmdCls();
        command.execute(notification);
    };
    return Controlller;
}());
/**
 * Model与Proxy Proxy（模式），
 * 提供了一个一个包装器或一个中介被客户端调用，
 * 从而达到去访问在场景背后的真实对象。
 * Proxy模式可以方便的将操作转给真实对象，或者提供额外的逻辑。
 * 在PureMVC中，Model保存了对Proxy对象的引用，
 * Proxy去操作具体的数据模型（Data Object）。也就是说，Proxy管理Data Object以及对Data Object的访问。
 */
var Model = /** @class */ (function () {
    function Model() {
        this._proxyHash = {};
    }
    Model.prototype.regist = function (proxy) {
        if (this._proxyHash[proxy.name]) {
            console.error("重复注册model:" + proxy.name);
            return;
        }
        this._proxyHash[proxy.name] = proxy;
        proxy.onRegist();
    };
    Model.prototype.remove = function (name) {
        var proxy = this._proxyHash[name];
        if (!proxy)
            return null;
        delete this._proxyHash[name];
        proxy.onRemove();
        return proxy;
    };
    Model.prototype.getProxy = function (name) {
        return this._proxyHash[name];
    };
    return Model;
}());
var Notifier = /** @class */ (function () {
    function Notifier() {
        this.facade = Facade.getInstance();
    }
    Notifier.prototype.sendNotification = function (name, body, type) {
        this.facade.sendNotification(name, body, type);
    };
    return Notifier;
}());
/**
 * 因对消息的观察者
 */
var Observer = /** @class */ (function () {
    function Observer() {
        this._count = 0; //引用的次数
    }
    Observer.prototype.setTo = function (method, caller) {
        this._method = method;
        this._caller = caller;
    };
    Observer.prototype.useCountAdd = function () {
        this._count++;
    };
    Observer.prototype.execute = function (notificatrion) {
        this._method.call(this._caller, notificatrion);
    };
    Observer.prototype.compareNotifyContext = function (object) {
        return object === this._caller;
    };
    Observer.prototype.release = function () {
        this._count--;
        if (this._count <= 0) {
            this.recover();
        }
    };
    Observer.prototype.clear = function () {
        this._method = null;
        this._caller = null;
    };
    Observer.prototype.recover = function () {
        this.clear();
        if (!Observer._pool) {
            Observer._pool = [];
        }
        Observer._pool.push(this);
    };
    Observer.create = function (method, caller) {
        if (!method || !caller) {
            console.error("不能生成方法或者caller为空的执行者");
        }
        var mid = method["$_mid"] ? method["$_mid"] : (this.MID++);
        var cid = caller["$_cid"] ? caller["$_cid"] : (this.CID++);
        var result = this._hash && this._hash[mid + cid * 10000];
        if (Observer._pool && Observer._pool.length > 0) {
            result = Observer._pool.shift();
        }
        else {
            result = new Observer();
        }
        result.setTo(method, caller);
        result.useCountAdd();
        return result;
    };
    Observer.MID = 1;
    Observer.CID = 1;
    return Observer;
}());
exports.Observer = Observer;
var Notification = /** @class */ (function () {
    function Notification(name, body, type) {
        this._name = name;
        this._body = body;
        this._type = type;
    }
    Object.defineProperty(Notification.prototype, "name", {
        get: function () { return this._name; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Notification.prototype, "body", {
        get: function () { return this._body; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Notification.prototype, "type", {
        get: function () { return this._type; },
        enumerable: true,
        configurable: true
    });
    return Notification;
}());
exports.Notification = Notification;
/**
 * Mediator（模式），定义了一种封装对象之间交互的中介。这种设计模式被认为是行为模式因为它可以改变模式的运行行为。
 * 正如定义里所说，PureMVC中，View只关心UI，
 * 具体的对对象的操作由Mediator来管理，包括添加事件监听，
 * 发送或接受Notification，改变组件状态等。这也解决了视图与视图控制逻辑的分离。
 */
var Mediator = /** @class */ (function (_super) {
    __extends(Mediator, _super);
    function Mediator(name, viewCompoment) {
        var _this = _super.call(this) || this;
        _this._bReigsted = false;
        _this._cmdList = [];
        _this._methodHash = {};
        _this._name = name;
        _this._viewCompoment = viewCompoment;
        return _this;
    }
    Mediator.prototype.registCmd = function (cmd, method) {
        var cmds;
        if (typeof cmd == "string") {
            cmds = [cmd];
        }
        else {
            cmds = cmd;
        }
        for (var i = 0; i < cmds.length; i++) {
            cmd = cmds[i];
            if (!this._methodHash[cmd]) {
                this._cmdList.push(cmd);
                if (this._bReigsted) {
                    this.facade.registerObserver(cmd, Observer.create(this.execute, this));
                }
            }
            this._methodHash[cmd] = method;
        }
    };
    Mediator.prototype.removeCmd = function (cmd, method) {
        if (!method || this._methodHash[cmd] == method) {
            var index = this._cmdList.indexOf(cmd);
            if (index > -1) {
                this._cmdList.splice(index, 1);
            }
            delete this._methodHash[cmd];
            if (this._bReigsted) {
                this.facade.removeObserver(cmd, this);
            }
        }
    };
    Mediator.prototype.execute = function (notification) {
        var method = this._methodHash[notification.name];
        if (method) {
            method.call(this, notification);
        }
    };
    Mediator.prototype.onRemove = function () {
        this._bReigsted = false;
        this._viewCompoment = null;
    };
    Mediator.prototype.onRegist = function () {
        this._bReigsted = true;
    };
    Object.defineProperty(Mediator.prototype, "listNotificationInterests", {
        get: function () {
            return this._cmdList;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Mediator.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    return Mediator;
}(Notifier));
exports.Mediator = Mediator;
var SimpleCommand = /** @class */ (function (_super) {
    __extends(SimpleCommand, _super);
    function SimpleCommand() {
        return _super.call(this) || this;
    }
    SimpleCommand.prototype.execute = function (notification) {
    };
    return SimpleCommand;
}(Notifier));
exports.SimpleCommand = SimpleCommand;
var Proxy = /** @class */ (function (_super) {
    __extends(Proxy, _super);
    function Proxy(name, data) {
        var _this = _super.call(this) || this;
        _this._name = name;
        if (data) {
            _this.setData(data);
        }
        return _this;
    }
    Proxy.prototype.setData = function (data) {
        this._data = data;
    };
    Proxy.prototype.getData = function () {
        return this._data;
    };
    Object.defineProperty(Proxy.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    Proxy.prototype.onRegist = function () { };
    Proxy.prototype.onRemove = function () {
        this._data = null;
    };
    return Proxy;
}(Notifier));
exports.Proxy = Proxy;
