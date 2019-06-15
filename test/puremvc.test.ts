import { Facade, Mediator, Proxy, Observer, SimpleCommand } from "../src/Facade";

import chai = require("chai")
var facade:Facade ;

describe(`puremvc 测试`, function(){ 
    it(`facade test`,()=>{
        facade = Facade.getInstance();
        chai.expect(facade,'facade exist').to.exist;
    })
    it(`mediator test`,(done)=>{
        class tm extends Mediator {
            onRegist() {
                super.onRegist();
                this.registCmd("cmd_t1",n=>{
                    chai.expect(n.name,'mediator 测试失败').to.equal('cmd_t1');
                    done();
                })
            }
        }
        facade.registMediator(new tm('tmTest'));
        facade.sendNotification('cmd_t1',{a:1});
    })
    it(`proxy test`,done=>{
        class tproxy extends Proxy {
            update(d:{a:number}) {
                this._data.a = d.a;
                this.sendNotification(this.cmd_update,this._data);
            }

            get cmd_update():string {
                return `${this.name}.update`;
            }
        }

        var testProxy = new tproxy('test_proxy',{a:1});
        facade.registerObserver(testProxy.cmd_update,Observer.create((n)=>{
            chai.expect(n.body,'mediator 测试失败').to.have.property('a',3);
            done();
        },this))
        facade.registProxy(testProxy);
        testProxy.update({a:3});
    }) 
    it(`command test`,(done)=>{
        class command_test extends SimpleCommand {
            execute(n) {
                chai.expect(n.name,'command 测试失败').to.equal('test_command');
                done();
            }
        }
        facade.registCommand(`test_command`,command_test);
        facade.sendNotification(`test_command`);
    })
})