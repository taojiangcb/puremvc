
/**
 * Facade是与核心层（Model,View,Controller）进行通信的唯一接口，
 * 目的是简化开发复杂度。实际编码过程中，不需要手动实现这三类文件，
 * Facade类在构造方法中已经包含了对这三类单例的构造
 */
"use strict";

import { IMediator, IFacade, IProxy, INotifier, INotification, IObserver } from "./IFacade";

export class Facade implements IFacade {
	private static _instance: Facade;
	private _view: View;								
	private _controller: Controlller;
	private _model: Model;
	private _obseverHash: any;
	constructor() {
		this._view = new View();
		this._controller = new Controlller();
		this._model = new Model();
		this._obseverHash = {};
	}

	public static getInstance(): Facade {
		return this._instance || (this._instance = new Facade());
	}

	/**
	 * 注册显示管理对象
	 * @param mediator 
	 */
	public registMediator(mediator: IMediator) {
		this._view.regist(mediator);
	}

	public removeMediator(name: string): IMediator {
		return this._view.remove(name);
	}

	public getMediator(name: string): IMediator {
		return this._view.getMediator(name);
	}

	public registCommand(cmd: string, cmdCls: Function) {
		this._controller.regist(cmd, cmdCls);
	}

	public removeCommand(cmd: string) {
		this._controller.remove(cmd);
	}

	public hasCommand(cmd: string): boolean {
		return this._controller.has(cmd);
	}

	public registProxy(proxy: IProxy) {
		this._model.regist(proxy);
		return proxy;
	}

	public removeProxy(name: string): IProxy {
		return this._model.remove(name);
	}

	public getProxy(name: string): IProxy {
		return this._model.getProxy(name);
	}

	sendNotification(name: string, body?: any, type?: string) {
		var notification = new Notification(name, body, type);
		this.executeObsever(notification);
		this._controller.executeCommend(notification);
	}

	registerObserver(notificationName: string, observer: Observer): void {
		var observers: Observer[] = this._obseverHash[notificationName];
		if (observers)
			observers.push(observer);
		else
			this._obseverHash[notificationName] = [observer];
	}


	//移除注册执行对象，这里默认一个命令对应同一个对象只可能存在一个执行method，不然存在移除错误目标的bug
	removeObserver(notificationName: string, notifyContext: any): void {
		var observers: Observer[] = this._obseverHash[notificationName];
		var i: number = observers.length;
		while (i--) {
			var observer: Observer = observers[i];
			if (observer.compareNotifyContext(notifyContext)) {
				observers.splice(i, 1);
				observer.release();
				break;
			}
		}

		if (observers.length == 0)
			delete this._obseverHash[notificationName];
	}

	executeObsever(notification) {
		var notificationName: string = notification.name;
		var observersRef: Array<Observer> = this._obseverHash[notificationName];
		if (observersRef) {
			var observers = observersRef.concat();
			var len = observers.length;
			for (var i = 0; i < len; i++) {
				var observer = observers[i];
				observer.execute(notification);
			}
		}
	}
}

/**
 * View 保存对 Mediator 对象的引用。由 Mediator 对象来操作具体的视图组件（
 * View Component，它的作用还包括：添加事件监听器，发送或接收 Notification，
 * 直接改变视图组件的状态。通过这样，就可以把视图和控制它的逻辑分离开来。
 */
class View {
	
	private _mediatorHash: any;
	constructor() { this._mediatorHash = {};}

	/**
	 * 注册中间媒介
		 * @param md 
	 */
	public regist(md: IMediator) {
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
	}

	public remove(name: string): IMediator {
		var mediator: Mediator = this._mediatorHash[name];
		if (!mediator) return null;
		var cmds = mediator.listNotificationInterests;
		var len = cmds.length;
		var facade = Facade.getInstance();
		for (var i = 0; i < len; i++) {
			facade.removeObserver(cmds[i], mediator);
		}
		delete this._mediatorHash[name];
		mediator.onRemove();
		return mediator;
	}

	public getMediator(name: string): IMediator {
		return this._mediatorHash[name];
	}
}


/**
 * Controller与Command Command（模式），是一种行为设计模式，
 * 这种模式下所有动作或者行为所需信息被封装到一个对象之内。Command模式解耦了发送者与接收者之间的联系。
 * 在PureMVC中，Controller保存了所有Command的映射。Command是无状态且惰性的，只有在需要的时候才被创建。
 */
class Controlller {

	private _commondHash: any;
	constructor() { this._commondHash = {};}

	public regist(cmd: string, cmdCls: Function) {
		if (this._commondHash[cmd]) {
			console.error("重复注册Controller:" + cmd);
			return;
		}
		this._commondHash[cmd] = cmdCls;
	}

	public remove(cmd: string) {
		delete this._commondHash[cmd];
	}

	public has(cmd): boolean {
		return this._commondHash[cmd] != null;
	}

	public executeCommend(notification: Notification) {
		var cmdCls = this._commondHash[notification.name];
		if (!cmdCls) return;
		var command: SimpleCommand = new cmdCls();
		command.execute(notification);
	}
}

/**
 * Model与Proxy Proxy（模式），
 * 提供了一个一个包装器或一个中介被客户端调用，
 * 从而达到去访问在场景背后的真实对象。
 * Proxy模式可以方便的将操作转给真实对象，或者提供额外的逻辑。
 * 在PureMVC中，Model保存了对Proxy对象的引用，
 * Proxy去操作具体的数据模型（Data Object）。也就是说，Proxy管理Data Object以及对Data Object的访问。
 */
class Model {
	private _proxyHash: any;
	constructor() {
		this._proxyHash = {};
	}

	public regist(proxy: IProxy) {
		if (this._proxyHash[proxy.name]) {
			console.error("重复注册model:" + proxy.name);
			return;
		}
		this._proxyHash[proxy.name] = proxy;
		proxy.onRegist();
	}


	public remove(name: string): IProxy {
		var proxy = this._proxyHash[name];
		if (!proxy) return null;
		delete this._proxyHash[name];
		proxy.onRemove();
		return proxy;
	}

	public getProxy(name: string): IProxy {
		return this._proxyHash[name];
	}
}

class Notifier implements INotifier {
	facade: Facade;
	constructor() {
		this.facade = Facade.getInstance();
	}

	sendNotification(name: string, body?: any, type?: string) {
		this.facade.sendNotification(name, body, type);
	}
}

/**
 * 因对消息的观察者
 */
export class Observer implements IObserver {
	private static _pool: Array<Observer>;		//池子暂时不用
	
	private static _hash: any;

	static MID: number = 1;						
	static CID: number = 1;

	private _method: Function;				   //观察到被执行的方法
	private _caller: any;						//执行方法的调用对象			
	private _count: number = 0;					//引用的次数
	constructor() {}

	setTo(method: Function, caller: any) {
		this._method = method;
		this._caller = caller;
	}

	useCountAdd() {
		this._count++;
	}

	execute(notificatrion: INotification) {
		this._method.call(this._caller, notificatrion);
	}
	
	compareNotifyContext(object: any): boolean {
		return object === this._caller;
	}

	release() {
		this._count--;
		if (this._count <= 0) {
			this.recover();
		}
	}

	clear() {
		this._method = null;
		this._caller = null;
	}

	recover() {
		this.clear();
		if (!Observer._pool) {
			Observer._pool = [];
		}
		Observer._pool.push(this);
	}

	static create(method: Function, caller: any): Observer {
		if (!method || !caller) {
			console.error("不能生成方法或者caller为空的执行者");
		}
		var mid = method["$_mid"] ? method["$_mid"] : (this.MID++);
		var cid = caller["$_cid"] ? caller["$_cid"] : (this.CID++);
		var result: Observer = this._hash && this._hash[mid + cid * 10000];
		if (Observer._pool && Observer._pool.length > 0) {
			result = Observer._pool.shift();
		} else {
			result = new Observer();
		}
		result.setTo(method, caller);
		result.useCountAdd();
		return result;
	}
}

export class Notification implements INotification {
	private _name: string;
	private _body: any;
	private _type: string;
	constructor(name: string, body?: any, type?: string) {
		this._name = name;
		this._body = body;
		this._type = type;
	}

	get name(): string { return this._name; }
	get body(): any { return this._body; }
	get type(): string { return this._type; }
}

/**
 * Mediator（模式），定义了一种封装对象之间交互的中介。这种设计模式被认为是行为模式因为它可以改变模式的运行行为。
 * 正如定义里所说，PureMVC中，View只关心UI，
 * 具体的对对象的操作由Mediator来管理，包括添加事件监听，
 * 发送或接受Notification，改变组件状态等。这也解决了视图与视图控制逻辑的分离。
 */
export class Mediator extends Notifier implements IMediator {
	protected _name: string;
	protected _cmdList: Array<string>;
	protected _methodHash: any;									//观察者方法的对象池
	protected _bReigsted: boolean = false;

	protected _viewCompoment: any;								//view显示层的对象
	constructor(name: string, viewCompoment?: any) {
		super();
		this._cmdList = [];
		this._methodHash = {};
		this._name = name;
		this._viewCompoment = viewCompoment;
	}

	registCmd(cmd: string | string[], method: Function) {
		var cmds: string[];
		if (typeof cmd == "string") { cmds = [cmd];} 
		else { cmds = cmd;}
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
	}

	removeCmd(cmd: string, method?: Function) {
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
	}

	execute(notification: Notification) {
		var method: Function = this._methodHash[notification.name];
		if (method) {
			method.call(this, notification);
		}
	}

	onRemove() {
		this._bReigsted = false;
		this._viewCompoment = null;
	}

	onRegist() {
		this._bReigsted = true;
	}

	public get listNotificationInterests(): Array<string> {
		return this._cmdList;
	}

	public get name(): string {
		return this._name;
	}
}

export class SimpleCommand extends Notifier {
	constructor() {
		super();
	}

	public execute(notification: Notification) {

	}
}


export class Proxy extends Notifier implements IProxy {
	protected _name: string;
	protected _data: any;
	constructor(name: string, data?: any) {
		super();
		this._name = name;
		if (data) {
			this.setData(data);
		}
	}

	public setData(data: any) {
		this._data = data;
	}

	public getData(): any {
		return this._data;
	}

	public get name(): string {
		return this._name;
	}

	public onRegist() { }

	public onRemove() {
		this._data = null;
	}
}