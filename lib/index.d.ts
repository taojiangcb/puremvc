

interface IFacade {
    /**
     * 注册显示管理对象
     * @param mediator 
     */
    registMediator(mediator: IMediator);
    removeMediator(name: string): IMediator;
    getMediator(name: string): IMediator;
    registCommand(cmd: string, cmdCls: Function);
    removeCommand(cmd: string);
    hasCommand(cmd: string): boolean;
    registProxy(proxy: IProxy);
    removeProxy(name: string): IProxy;
    getProxy(name:string): IProxy;
    sendNotification(namne: string, body?: any, type?: string);
    registerObserver(notificationName: string, observer: IObserver): void;
    //移除注册执行对象，这里默认一个命令对应同一个对象只可能存在一个执行method，不然存在移除错误目标的bug
    removeObserver(notificationName: string, notifyContext: any): void;
    executeObsever(notification):void;
}

interface INotifier {
    sendNotification(namne: string, body?: any, type?: string);
}

/**
 * 观察者
 */
interface IObserver {
    setTo(method: Function, caller: any);
    useCountAdd();
    execute(notificatrion: INotification);
    compareNotifyContext(object: any): boolean;
    release();
    clear();
    recover();
}

interface INotification {
    name: string;
    body: any;
    type: string;
}

/**
 * 
 */
interface IMediator extends INotifier {
    registCmd(cmd: string, method: Function);
    removeCmd(cmd: string, method?: Function);
    execute(notification: INotification);
    onRemove();
    onRegist();
    listNotificationInterests: Array<string>;
    name: string;
}

interface ISimpleCommand extends INotifier {
    execute(notification: INotification);
}


interface IProxy extends INotifier {
    setData(data: any);
    getData(): any;
    name: string;
    onRegist();
    onRemove();
}