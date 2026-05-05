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

    public async execute(callback: (api: any) => Promise<any>) {
        const client = new RouterOSClient(this.config);
        const api = await client.connect();
        try {
            return await callback(api);
        } finally {
            client.close();
        }
    }

    public async getActiveUsers() {
        return this.execute(api => api.menu('/ppp/active').get());
    }

    public async getPPPProfiles() {
        return this.execute(api => api.menu('/ppp/profile').get());
    }

    public async getSecrets() {
        return this.execute(api => api.menu('/ppp/secret').get());
    }

    public async addSecret(name: string, password: string, profile: string, service: string = 'any') {
        return this.execute(api => api.menu('/ppp/secret').add({ name, password, profile, service }));
    }

    public async isolateUser(name: string, isolatedProfile: string) {
        return this.execute(async (api) => {
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
        });
    }

    public async getInterfaces() {
        return this.execute(api => api.menu('/interface').get());
    }

    public async getInterfaceTraffic(interfaceName: string) {
        return this.execute(api => api.menu('/interface').exec('monitor-traffic', { interface: interfaceName, once: '' }));
    }

    public async getResources() {
        return this.execute(api => api.menu('/system/resource').get());
    }

    public async getLogs(limit: number = 20) {
        return this.execute(async (api) => {
            const result = await api.menu('/log').get();
            return result.slice(-limit).reverse();
        });
    }

    public async ping(address: string, count: number = 1) {
        return this.execute(api => api.menu('/ping').exec({ address, count: count.toString() }));
    }

    public async removeSecret(name: string) {
        return this.execute(async (api) => {
            const secret = await api.menu('/ppp/secret').where('name', name).get();
            if (secret.length > 0) {
                await api.menu('/ppp/secret').remove(secret[0]['.id']);
            }
        });
    }

    public async updateSecret(name: string, password?: string, profile?: string) {
        return this.execute(async (api) => {
            const secret = await api.menu('/ppp/secret').where('name', name).get();
            if (secret.length > 0) {
                const params: any = { '.id': secret[0]['.id'] };
                if (password) params.password = password;
                if (profile) params.profile = profile;
                await api.menu('/ppp/secret').update(params);
            }
        });
    }
} // VERIFIED_BY_AI_12345
