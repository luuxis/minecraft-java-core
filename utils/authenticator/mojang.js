'use strict';

const { v3: uuidv3 }  = require('uuid')
const fetch = require('node-fetch')

class Mojang {
  async getAuth(username, password){
    let UUID = uuidv3(username, uuidv3.DNS)
    if (!password) {
      let user = {
        access_token: 'null',
        client_token: 'null',
        uuid: UUID,
        name: username,
        user_properties: '{}',
        meta: {
          offline: true,
          type: 'mojang'
        }
      }
      return user
    }

    let post = {
      agent: {
        name: "Minecraft",
        version: 1
      },
      username,
      password,
      clientToken: UUID,
      requestUser: true
    }

    let message = await fetch("https://authserver.mojang.com/authenticate", {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      }, 
      body: JSON.stringify(post)
    }).then(res => res.json());

    if(message.error) return message;
    if(message.availableProfiles.length == 0) return {error: true, errorMessage: "noacc"};
    let user = {
      access_token: message.accessToken,
      client_token: message.clientToken,
      uuid: message.selectedProfile.id,
      name: message.selectedProfile.name,
      user_properties: '{}',
      meta: {
        offline: false,
        type: 'mojang'
      }
    }
    return user
  }

  async refresh(acc){
    let post = {
      accessToken: acc.access_token,
      clientToken: acc.client_token,
      requestUser: true
    }
    let message = await fetch("https://authserver.mojang.com/refresh", {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      }, 
      body: JSON.stringify(post)
    }).then(res => res.json());
    
    if(message.error) return message;
    let user = {
      access_token: message.accessToken,
      client_token: message.clientToken,
      uuid: message.selectedProfile.id,
      name: message.selectedProfile.name,
      user_properties: '{}',
      meta: {
        offline: false,
        type: 'mojang'
      }
    }
    return user
  }

  async validate(acc){
    let post = {
      accessToken: acc.access_token,
      clientToken: acc.client_token,
    }
    let message = await fetch("https://authserver.mojang.com/validate", {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      }, 
      body: JSON.stringify(post)
    });
    
    if(message.status == 204) return true
    else return false
  }

  async invalidate(acc){
    let post = {
      accessToken: acc.access_token,
      clientToken: acc.client_token,
    }

    let message = await fetch("https://authserver.mojang.com/invalidate", {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      }, 
      body: JSON.stringify(post)
    }).then(res => res.text());

    if(message == ""){
      return true;
    } else return false;
  }
}

module.exports = new Mojang;