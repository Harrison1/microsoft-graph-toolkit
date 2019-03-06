import { IAuthProvider, LoginChangedEvent, LoginType } from "./IAuthProvider";
import { Graph } from './GraphSDK';
import { EventHandler, EventDispatcher } from './EventHandler';
import { MsalConfig } from './MsalConfig';
import {UserAgentApplication} from "msal/lib-es6";

export class MsalProvider implements IAuthProvider {
        
    private _loginChangedDispatcher = new EventDispatcher<LoginChangedEvent>();
    private _loginType : LoginType;
    private _clientId : string;
    
    private _idToken : string;

    private _provider : UserAgentApplication;

    private _resolveToken;
    private _rejectToken;
    
    get provider() {
        return this._provider;
    };

    get isLoggedIn() : boolean {
        return !!this._idToken;
    };

    get isAvailable(): boolean{
        return true;
    };

    scopes: string[];
    authority: string;
    
    graph: Graph;

    constructor(config: MsalConfig) {
        if (!config.clientId) {
            throw "ClientID must be a valid string";
        }

        this.initProvider(config);
    }

    private initProvider(config: MsalConfig) {
        this._clientId = config.clientId;
        this.scopes = (typeof config.scopes !== 'undefined') ? config.scopes : ["user.read"];
        this.authority = (typeof config.authority !== 'undefined') ? config.authority : null;
        let options = (typeof config.options != 'undefined') ? config.options : {cacheLocation: 'localStorage'};
        this._loginType = (typeof config.loginType !== 'undefined') ? config.loginType : LoginType.Redirect;

        let callbackFunction = ((errorDesc : string, token: string, error: any, tokenType: any, state: any) => {
            this.tokenReceivedCallback(errorDesc, token, error, tokenType, state);
        }).bind(this);

        // import msal
        // let msal = await import(/* webpackChunkName: "msal" */ "msal/lib-es6");

        this._provider = new UserAgentApplication(this._clientId, this.authority, callbackFunction, options);
        this.graph = new Graph(this);

        this.tryGetIdTokenSilent();
    }
    
    async login(): Promise<void> {
        if (this._loginType == LoginType.Popup) {
            this._idToken = await this.provider.loginPopup(this.scopes);
            this.fireLoginChangedEvent({});
        } else {
            this.provider.loginRedirect(this.scopes);
        }
    }

    async tryGetIdTokenSilent() : Promise<boolean> {
        try {
            this._idToken = await this.provider.acquireTokenSilent([this._clientId]);
            console.log("tryGetIdTokenSilent: idToken " + this._idToken)
            if (this._idToken) {
                this.fireLoginChangedEvent({});
            }
            return this.isLoggedIn;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async getAccessToken(): Promise<string> {
        let accessToken : string;
        try {
            accessToken = await this.provider.acquireTokenSilent(this.scopes);
        } catch (e) {
            try {
                // TODO - figure out for what error this logic is needed so we
                // don't prompt the user to login unnecessarily
                if (this._loginType == LoginType.Redirect) {
                    this.provider.acquireTokenRedirect(this.scopes);
                    return new Promise((resolve, reject) => {
                        this._resolveToken = resolve;
                    });
                } else {
                    accessToken = await this.provider.acquireTokenPopup(this.scopes);
                }
            } catch (e) {
                // TODO - figure out how to expose this during dev to make it easy for the dev to figure out
                // if error contains "'token' is not enabled", make sure to have implicit oAuth enabled in the AAD manifest
                console.log(e);
                throw e;
            }
        }
        return accessToken;
    }

    addScope(...scopes : string[]) {
        let combinedScopes = [...scopes, ...this.scopes];
        let set = new Set(combinedScopes);
        this.scopes = [...set];
    }
    
    async logout(): Promise<void> {
        this.provider.logout();
        this.fireLoginChangedEvent({});
    }
    
    updateScopes(scopes: string[]) {
        this.scopes = scopes;
    }

    tokenReceivedCallback(errorDesc : string, token: string, error: any, tokenType, state: any)
    {
        console.log("tokenReceivedCallback");
        if (error) {
            console.log("tokenReceivedCallback: errorDesc = " + errorDesc)
            if (this._rejectToken) {
                this._rejectToken(errorDesc);
            }
        } else {
            console.log("tokenReceivedCallback: tokenType = " + tokenType)
            if (tokenType === 'id_token') {
                this._idToken = token;
                this.fireLoginChangedEvent({});
            } else {
                if (this._resolveToken) {
                    this._resolveToken(token);
                }
            }
            
        }
    }

    onLoginChanged(eventHandler : EventHandler<LoginChangedEvent>) {
        this._loginChangedDispatcher.register(eventHandler);
    }

    private fireLoginChangedEvent(event : LoginChangedEvent) {
        this._loginChangedDispatcher.fire(event);
    }
}