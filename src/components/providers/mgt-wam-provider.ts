import { LitElement, customElement, property } from 'lit-element';
import { Providers } from '../../Providers';
import { WamProvider } from '../../providers/WamProvider';

@customElement('mgt-wam-provider')
export class MgtWamProvider extends LitElement {

    @property({attribute: 'client-id'}) clientId : string;

    @property({attribute: 'authority'}) authority? : string;

    constructor(){
        super();
        this.validateAuthProps();
    }
    
    attributeChangedCallback(name, oldval, newval) {
        super.attributeChangedCallback(name, oldval, newval);
        this.validateAuthProps();
    }

    private validateAuthProps() {
        if (this.clientId !== undefined) {
            Providers.GlobalProvider = new WamProvider(this.clientId, this.authority);
        }
    }
}