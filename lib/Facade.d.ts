import { IMediator, IFacade, IProxy, INotifier, INotification, IObserver } from "./IFacade";
export declare class Facade implements IFacade {
    private static _instance;
    private _view;
    private _controller;
    private _model;
    private _obseverHash;
    constructor();
    static getInstance(): Facade;
    /**
     * 注册显示管理对象
     * @param mediator
     */
    registMediator(mediator: IMediator): void;
    removeMediator(name: string): IMediator;
    getMediator(name: string): IMediator;
    registCommand(cmd: string, cmdCls: Function): void;
    removeCommand(cmd: string): void;
    hasCommand(cmd: string): boolean;
    registProxy(proxy: IProxy): IProxy;
    removeProxy(name: string): IProxy;
    getProxy(name: string): IProxy;
    sendNotification(name: string, body?: any, type?: string): void;
    registerObserver(notificationName: string, observer: Observer): void;
    removeObserver(notificationName: string, notifyContext: any): void;
    executeObsever(notification: any): void;
}
declare class Notifier implements INotifier {
    facade: Facade;
    constructor();
    sendNotification(name: string, body?: any, type?: string): void;
}
/**
 * 因对消息的观察者
 */
export declare class Observer implements IObserver {
    private static _pool;
    private static _hash;
    static MID: number;
    static CID: number;
    private _method;
    private _caller;
    private _count;
    constructor();
    setTo(method: Function, caller: any): void;
    useCountAdd(): void;
    execute(notificatrion: INotification): void;
    compareNotifyContext(object: any): boolean;
    release(): void;
    clear(): void;
    recover(): void;
    static create(method: Function, caller: any): Observer;
}
export declare class Notification implements INotification {
    private _name;
    private _body;
    private _type;
    constructor(name: string, body?: any, type?: string);
    readonly name: string;
    readonly body: any;
    readonly type: string;
}
/**
 * Mediator（模式），定义了一种封装对象之间交互的中介。这种设计模式被认为是行为模式因为它可以改变模式的运行行为。
 * 正如定义里所说，PureMVC中，View只关心UI，
 * 具体的对对象的操作由Mediator来管理，包括添加事件监听，
 * 发送或接受Notification，改变组件状态等。这也解决了视图与视图控制逻辑的分离。
 */
export declare class Mediator extends Notifier implements IMediator {
    protected _name: string;
    protected _cmdList: Array<string>;
    protected _methodHash: any;
    protected _bReigsted: boolean;
    protected _viewCompoment: any;
    constructor(name: string, viewCompoment?: any);
    registCmd(cmd: string | string[], method: Function): void;
    removeCmd(cmd: string, method?: Function): void;
    execute(notification: Notification): void;
    onRemove(): void;
    onRegist(): void;
    readonly listNotificationInterests: Array<string>;
    readonly name: string;
}
export declare class SimpleCommand extends Notifier {
    constructor();
    execute(notification: Notification): void;
}
export declare class Proxy extends Notifier implements IProxy {
    protected _name: string;
    protected _data: any;
    constructor(name: string, data?: any);
    setData(data: any): void;
    getData(): any;
    readonly name: string;
    onRegist(): void;
    onRemove(): void;
}
export {};
