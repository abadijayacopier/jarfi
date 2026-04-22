import { RouterOSClient } from 'routeros-client';

export interface MikrotikConfig {
    host: string;
    user: string;
    password?: string;
    port?: number;
}

export class MikrotikService {
    private config: MikrotikConfig;

    constructor(config: MikrotikConfig) {
        this.config = {
            host: config.host,
            user: config.user,
            password: config.password || '',
            port: config.port || 8728,
        };
    }

    public async getActiveUsers() {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const result = await api.menu('/ppp/active').get();
            return result;
        } finally {
            client.close();
        }
    }

    public async getPPPProfiles() {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const result = await api.menu('/ppp/profile').get();
            return result;
        } finally {
            client.close();
        }
    }

    public async getSecrets() {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const result = await api.menu('/ppp/secret').get();
            return result;
        } finally {
            client.close();
        }
    }

    public async addSecret(name: string, password: string, profile: string, service: string = 'any') {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const result = await api.menu('/ppp/secret').add({ name, password, profile, service });
            return result;
        } finally {
            client.close();
        }
    }

    public async isolateUser(name: string, isolatedProfile: string) {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const menu = api.menu('/ppp/secret');
            const secret = await menu.where('name', name).get();
            if (secret && secret.length > 0) {
                const result = await menu.update({ '.id': secret[0]['.id'], profile: isolatedProfile });

                const activeMenu = api.menu('/ppp/active');
                const active = await activeMenu.where('name', name).get();
                if (active && active.length > 0) {
                    await activeMenu.remove(active[0]['.id']);
                }

                return result;
            }
            throw new Error('User not found');
        } finally {
            client.close();
        }
    }

    // --- Hotspot Voucher Methods ---

    public async addHotspotUser(name: string, password: string, profile: string, server: string = 'all') {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const result = await api.menu('/ip/hotspot/user').add({ name, password, profile, server });
            return result;
        } finally {
            client.close();
        }
    }

    public async getHotspotProfiles() {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const result = await api.menu('/ip/hotspot/user/profile').get();
            return result;
        } finally {
            client.close();
        }
    }

    public async addHotspotProfile(name: string, rateLimit?: string, sessionTimeout?: string, sharedUsers: number = 1) {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const params: any = { name, 'shared-users': sharedUsers.toString() };
            if (rateLimit) params['rate-limit'] = rateLimit;
            if (sessionTimeout) params['session-timeout'] = sessionTimeout;
            
            const result = await api.menu('/ip/hotspot/user/profile').add(params);
            return result;
        } finally {
            client.close();
        }
    }

    public async removeHotspotProfile(id: string) {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            await api.menu('/ip/hotspot/user/profile').remove(id);
        } finally {
            client.close();
        }
    }

    public async getInterfaces() {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            return await api.menu('/interface').get();
        } finally {
            client.close();
        }
    }

    public async getInterfaceTraffic(interfaceName: string) {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const menu = api.menu('/interface');
            const result = await menu.exec('monitor-traffic', { interface: interfaceName, once: '' });
            return result;
        } finally {
            client.close();
        }
    }

    public async getResources() {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            return await api.menu('/system/resource').get();
        } finally {
            client.close();
        }
    }

    public async getLogs(limit: number = 20) {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const result = await api.menu('/log').get();
            return result.slice(-limit).reverse();
        } finally {
            client.close();
        }
    }

    public async removeSecret(name: string) {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const secret = await api.menu('/ppp/secret').where('name', name).get();
            if (secret.length > 0) {
                await api.menu('/ppp/secret').remove(secret[0]['.id']);
            }
        } finally {
            client.close();
        }
    }

    public async updateSecret(name: string, password?: string, profile?: string) {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            const secret = await api.menu('/ppp/secret').where('name', name).get();
            if (secret.length > 0) {
                const params: any = { '.id': secret[0]['.id'] };
                if (password) params.password = password;
                if (profile) params.profile = profile;
                await api.menu('/ppp/secret').update(params);
            }
        } finally {
            client.close();
        }
    }
}
