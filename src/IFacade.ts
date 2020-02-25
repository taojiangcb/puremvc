

export interface IFacade {
  
  /*** 显示对象管理 */
  registMediator(mediator: IMediator);
  removeMediator(name: string): IMediator;
  getMediator(name: string): IMediator;

  /**可执行的消息命令 */
  registCommand(cmd: string, cmdCls: Function);
  removeCommand(cmd: string);
  hasCommand(cmd: string): boolean;

  /**proxy */
  registProxy(proxy: IProxy);
  removeProxy(name: string): IProxy;
  getProxy(name: string): IProxy;

  sendNotification(namne: string, body?: any, type?: string);
  registerObserver(notificationName: string, observer: IObserver): void;
  //移除注册执行对象，这里默认一个命令对应同一个对象只可能存在一个执行method，不然存在移除错误目标的bug
  removeObserver(notificationName: string, notifyContext: any): void;
  executeObsever(notification): void;
}

/**支持消息发送 */
export interface INotifier {
  sendNotification(namne: string, body?: any, type?: string);
}

/*** 观察者*/
export interface IObserver {
  
  setTo(method: Function, caller: any);
  useCountAdd();

  execute(notificatrion: INotification);

  compareNotifyContext(object: any): boolean;
  release();
  clear();
  recover();
}

export interface INotification {
  name: string;
  body: any;
  type: string;
}

/**view */
export interface IMediator extends INotifier {
  
  registCmd(cmd: string, method: Function);
  removeCmd(cmd: string, method?: Function);

  execute(notification: INotification);

  onRemove();
  onRegist();
  //消息列表
  listNotificationInterests: Array<string>;
  //
  name: string;
}

export interface ISimpleCommand extends INotifier {
  execute(notification: INotification);
}

/**proxy 数据域 */
export interface IProxy extends INotifier {
  setData(data: any);
  getData(): any;
  name: string;
  onRegist();
  onRemove();
}