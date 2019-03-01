jest.mock('msal');

import { MsalProvider } from './MSALProvider';
import { MsalConfig } from './MSALConfig';
import { LoginType } from './IAuthProvider';
import { UserAgentApplication } from 'msal';

describe('MSALProvider', () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('undefined clientId should throw exception', () => {
        const config: MsalConfig = {
            clientId: undefined,
        };
        expect(() => {
            new MsalProvider(config);
        }).toThrowError("ClientID must be a valid string");
    });

    it('_loginType Popup should call the loginPopup', async () => {
        const config: MsalConfig = {
            clientId: "abc",
            loginType: LoginType.Popup
        };
        const msalProvider = new MsalProvider(config);
        await msalProvider.login();
        expect(msalProvider.provider.loginPopup).toBeCalled();
    });
    
    it('_loginType Redirect should call the loginRedirect', async () => {
        const config: MsalConfig = {
            clientId: "abc",
            loginType: LoginType.Redirect
        };
        const msalProvider = new MsalProvider(config);
        await msalProvider.login();
        expect(msalProvider.provider.loginRedirect).toBeCalled();
    });

    it('getAccessToken should call acquireTokenSilent', async () => {
        const config: MsalConfig = {
            clientId: "abc",
            loginType: LoginType.Redirect
        };
        const msalProvider = new MsalProvider(config);
        const accessToken = await msalProvider.getAccessToken();
        expect(msalProvider.provider.acquireTokenSilent).toBeCalled();
    });

    it('logout should fire onLoginChanged callback', async () => {
        const config: MsalConfig = {
            clientId: "abc",
            loginType: LoginType.Redirect
        };
        const msalProvider = new MsalProvider(config);
        expect.assertions(1);
        msalProvider.onLoginChanged(()=>{
            expect(true).toBeTruthy();
        });
        await msalProvider.logout();
    });

    it('login should fire onLoginChanged callback when loginType is Popup', async () => {
        const config: MsalConfig = {
            clientId: "abc",
            loginType: LoginType.Popup
        };
        const msalProvider = new MsalProvider(config);
        expect.assertions(1);
        msalProvider.onLoginChanged(()=>{
            expect(true).toBeTruthy();
        });
        await msalProvider.login();
    });

    it('login should fire onLoginChanged callback when loginType is Redirect', async () => {
        const config: MsalConfig = {
            clientId: "abc",
            loginType: LoginType.Redirect
        };

        UserAgentApplication.prototype.loginRedirect = jest.fn().mockImplementationOnce(() => {
            msalProvider.tokenReceivedCallback(undefined, "", undefined, undefined);
        });

        const msalProvider = new MsalProvider(config);
        
        expect.assertions(1);
        msalProvider.onLoginChanged(()=>{
            expect(true).toBeTruthy();
        });
        await msalProvider.login();
    });

});