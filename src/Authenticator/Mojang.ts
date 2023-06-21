/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import crypto from 'crypto';
import nodeFetch from 'node-fetch';

let api_url = 'https://authserver.mojang.com';


async function login(username: string, password?: string) {
    let UUID = crypto.randomBytes(16).toString('hex');
    if (!password) {
        return {
            access_token: UUID,
            client_token: UUID,
            uuid: UUID,
            name: username,
            user_properties: '{}',
            meta: {
                online: false,
                type: 'Mojang'
            }
        }
    }

    let message = await nodeFetch(`${api_url}/authenticate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            agent: {
                name: "Minecraft",
                version: 1
            },
            username,
            password,
            clientToken: UUID,
            requestUser: true
        })
    }).then(res => res.json());

    if (message.error) {
        return message;
    };
    let user = {
        access_token: message.accessToken,
        client_token: message.clientToken,
        uuid: message.selectedProfile.id,
        name: message.selectedProfile.name,
        user_properties: '{}',
        meta: {
            online: true,
            type: 'Mojang'
        }
    }
    return user;
}

async function refresh(acc: any) {
    let message = await nodeFetch(`${api_url}/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            accessToken: acc.access_token,
            clientToken: acc.client_token,
            requestUser: true
        })
    }).then(res => res.json());

    if (message.error) {
        return message;
    };

    let user = {
        access_token: message.accessToken,
        client_token: message.clientToken,
        uuid: message.selectedProfile.id,
        name: message.selectedProfile.name,
        user_properties: '{}',
        meta: {
            online: true,
            type: 'Mojang'
        }
    }
    return user;
}

async function validate(acc: any) {
    let message = await nodeFetch(`${api_url}/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            accessToken: acc.access_token,
            clientToken: acc.client_token,
        })
    });

    if (message.status == 204) {
        return true;
    } else {
        return false;
    }
}

async function signout(acc: any) {
    let message = await nodeFetch(`${api_url}/invalidate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            accessToken: acc.access_token,
            clientToken: acc.client_token,
        })
    }).then(res => res.text());

    if (message == "") {
        return true;
    } else {
        return false;
    }
}

function ChangeAuthApi(url: string) {
    api_url = url
}

export {
    login as login,
    refresh as refresh,
    validate as validate,
    signout as signout,
    ChangeAuthApi as ChangeAuthApi
}