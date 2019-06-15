export interface IFacade {
    /**
     * 注册显示管理对象
     * @param mediator
     */
    registMediator(mediator: IMediator): any;
    removeMediator(name: string): IMediator;
    getMediator(name: string): IMediator;
    registCommand(cmd: string, cmdCls: Function): any;
    removeCommand(cmd: string): any;
    hasCommand(cmd: string): boolean;
    registProxy(proxy: IProxy): any;
    removeProxy(name: string): IProxy;
    getProxy(name: string): IProxy;
    sendNotification(namne: string, body?: any, type?: string): any;
    registerObserver(notificationName: string, observer: IObserver): void;
    removeObserver(notificationName: string, notifyContext: any): void;
    executeObsever(notification: any): void;
}
export interface INotifier {
    sendNotification(namne: string, body?: any, type?: string): any;
}
/**
 * 观察者
 */
export interface IObserver {
    setTo(method: Function, caller: any): any;
    useCountAdd(): any;
    execute(notificatrion: INotification): any;
    compareNotifyContext(object: any): boolean;
    release(): any;
    clear(): any;
    recover(): any;
}
export interface INotification {
    name: string;
    body: any;
    type: string;
}
/**
 *
 */
export interface IMediator extends INotifier {
    registCmd(cmd: string, method: Function): any;
    removeCmd(cmd: string, method?: Function): any;
    execute(notification: INotification): any;
    onRemove(): any;
    onRegist(): any;
    listNotificationInterests: Array<string>;
    name: string;
}
export interface ISimpleCommand extends INotifier {
    execute(notification: INotification): any;
}
export interface IProxy extends INotifier {
    setData(data: any): any;
    getData(): any;
    name: string;
    onRegist(): any;
    onRemove(): any;
}
