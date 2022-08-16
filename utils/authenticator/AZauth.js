/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

const nodeFetch = require('node-fetch');

module.exports = class AZauth {
    constructor(url) {
        this.url = `${url}/api/auth`;
    }

    async getAuth(username, password, A2F = null) {
        let auth = await nodeFetch(`${this.url}/authenticate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: username,
                password: password,
                code: A2F
            }),
        }).then(res => res.json())

        if (auth.status == 'pending' && auth.reason == '2fa') return { A2F: true };

        if (auth.status == 'error') return {
            error: true,
            reason: auth.reason,
            message: auth.message
        };

        return {
            access_token: auth.access_token,
            client_token: getUUID(),
            uuid: auth.uuid,
            name: auth.username,
            user_properties: '{}',
            meta: {
                offline: false,
                type: 'Mojang'
            }
        }
    }

    async refresh(mc) {
        let auth = await nodeFetch(`${this.url}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: mc.access_token
            }),
        }).then(res => res.json())
        if (auth.status == 'error') return {
            error: true,
            reason: auth.reason,
            message: auth.message
        };

        return {
            access_token: auth.access_token,
            client_token: getUUID(),
            uuid: auth.uuid,
            name: auth.username,
            user_properties: '{}',
            meta: {
                offline: false,
                type: 'Mojang'
            }
        }
    }

    async logout(mc) {
        let auth = await nodeFetch(`${this.url}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: mc.access_token
            }),
        }).then(res => res.json())
        if (auth.error) return auth;
        return true
    }
}

function getUUID() {
    var result = ""
    for (var i = 0; i <= 4; i++) {
        result += (Math.floor(Math.random() * 16777216) + 1048576).toString(16);
        if (i < 4) result += "-"
    }
    return result;
}