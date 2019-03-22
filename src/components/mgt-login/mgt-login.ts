import { LitElement, html, customElement, property } from 'lit-element';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

import { Providers } from '../../providers';
import { styles } from './mgt-login-css';

import '../mgt-person/mgt-person';

@customElement('mgt-login')
export class MgtLogin extends LitElement {
  @property({ attribute: false }) private _user: MicrosoftGraph.User;
  @property({ attribute: false }) private _showMenu: boolean = false;

  static get styles() {
    return styles;
  }

  constructor() {
    super();
    Providers.onProvidersChanged(_ => this.init());
    this.init();
  }

  private async init() {
    const provider = Providers.getAvailable();
    if (provider) {
      provider.onLoginChanged(_ => this.loadState());
      await this.loadState();
    }
  }

  private async loadState() {
    const provider = Providers.getAvailable();

    if (provider && provider.isLoggedIn) {
      this._user = await provider.graph.me();
    }
  }

  public async login() {
    const provider = Providers.getAvailable();

    if (provider) {
      await provider.login();
      await this.loadState();
    }
  }

  public async logout() {
    const provider = Providers.getAvailable();
    if (provider) {
      await provider.logout();
    }
  }

  private clicked() {
    if (this._user) {
      this._showMenu = !this._showMenu;
    } else {
      this.login();
    }
  }

  render() {
    let content = this._user ? this.renderLoggedIn() : this.renderLoggedOut();

    return html`
      <div class="root">
        <button class="sign-in-button" @click=${this.clicked}>
          ${content}
        </button>
        ${this.renderMenu()}
      </div>
    `;
  }

  renderLoggedOut() {
    return html`
      <i class="sign-in-icon ms-Icon ms-Icon--AddFriend"></i>
      <span>
        Sign In
      </span>
    `;
  }

  renderLoggedIn() {
    return html`
      <div class="user-avatar">
        <mgt-person person-query="me" />
      </div>
      <span>
        ${this._user.displayName}
      </span>
    `;
  }

  renderMenu() {
    if (!this._user) {
      return;
    }

    return html`
      <div class="login-menu-root ${this._showMenu ? 'show-menu' : ''}">
        <div class="login-menu-beak"></div>
        <div class="login-menu-beak-cover"></div>
        <div class="login-menu-content">
          <div class="login-menu-user-profile">
            <div class="login-menu-user-image">
              <mgt-person person-query="me" image-size="65" />
            </div>
            <div class="login-menu-user-details">
              <div class="login-menu-user-display-name">
                ${this._user.displayName}
              </div>
              <div class="login-menu-user-email">${this._user.mail}</div>
            </div>
          </div>
          <div class="login-menu-commands">
            <ul>
              <li>
                <button class="login-menu-command" @click=${this.logout}>
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }
}
