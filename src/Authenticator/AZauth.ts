/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import nodeFetch from 'node-fetch';

export default class AZauth {
    url: string;
    constructor(url: string) {
        this.url = `${url}/api/auth`;
    }

    async login(username: string, password: string, A2F: any = null) {
        let response = await nodeFetch(`${this.url}/authenticate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: username,
                password: password,
                code: A2F
            }),
        }).then((res: any) => res.json())

        if (response.status == 'pending' && response.reason == '2fa') {
            return { A2F: true };
        }

        if (response.status == 'error') {
            return {
                error: true,
                reason: response.reason,
                message: response.message
            };
        }

        return {
            access_token: response.access_token,
            client_token: response.uuid,
            uuid: response.uuid,
            name: response.username,
            user_properties: '{}',
            user_info: {
                banned: response.banned,
                money: response.money,
                role: response.role
            },
            meta: {
                online: false,
                type: 'AZauth',
            }
        }
    }

    async verify(user: any) {
        let response = await nodeFetch(`${this.url}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                access_token: user.access_token
            }),
        }).then((res: any) => res.json())

        if (response.status == 'error') {
            return {
                error: true,
                reason: response.reason,
                message: response.message
            };
        }

        return {
            access_token: response.access_token,
            client_token: response.uuid,
            uuid: response.uuid,
            name: response.username,
            user_properties: '{}',
            user_info: {
                banned: response.banned,
                money: response.money,
                role: response.role
            },
            meta: {
                online: false,
                type: 'AZauth',
            }
        }
    }

    async signout(user: any) {
        let auth = await nodeFetch(`${this.url}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: user.access_token
            }),
        }).then((res: any) => res.json())
        if (auth.error) return false;
        return true
    }
}