import { IProvider, LoginChangedEvent, EventDispatcher, EventHandler } from "./IProvider";
import { IGraph, Graph } from '../Graph';

declare interface AadTokenProvider{
    getToken(x:string);
}

export declare interface WebPartContext{
    aadTokenProviderFactory : any;
}

export class SharePointProvider implements IProvider {
    
    private _loginChangedDispatcher = new EventDispatcher<LoginChangedEvent>();
    
    private _idToken : string;

    private _provider : AadTokenProvider;
    
    get provider() {
        return this._provider;
    };

    get isLoggedIn() : boolean {
        return !!this._idToken;
    };

    private context : WebPartContext;

    scopes: string[];
    authority: string;
    
    graph: IGraph;

    constructor(context : WebPartContext) {

        this.context = context;

        context.aadTokenProviderFactory.getTokenProvider().then((tokenProvider: AadTokenProvider): void => {
            this._provider = tokenProvider;
            this.graph = new Graph(this);
            this.internalLogin();
        });
        this.fireLoginChangedEvent({});
    }
    
    private async internalLogin(): Promise<void> {
        this._idToken = await this.getAccessToken();
        if (this._idToken) {
            this.fireLoginChangedEvent({});
        }
    }

    async getAccessToken(): Promise<string> {
        let accessToken : string;
        try {
            accessToken = await this.provider.getToken("https://graph.microsoft.com");
        } catch (e) {
            console.log(e);
            throw e;
        }
        return accessToken;
    }
    
    updateScopes(scopes: string[]) {
        this.scopes = scopes;
    }

    onLoginChanged(eventHandler : EventHandler<LoginChangedEvent>) {
        this._loginChangedDispatcher.register(eventHandler);
    }

    private fireLoginChangedEvent(event : LoginChangedEvent) {
        this._loginChangedDispatcher.fire(event);
    }
}