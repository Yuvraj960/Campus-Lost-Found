import { execSync } from 'node:child_process';
import { logger } from './logger.js';

/**
 * Resolves MongoDB SRV URIs (mongodb+srv://) into direct replica set URIs
 * when Node's internal c-ares DNS resolver fails with querySrv ECONNREFUSED on Windows.
 */
export const resolveMongoUri = (uri) => {
  if (!uri || !uri.startsWith('mongodb+srv://')) {
    return uri;
  }

  try {
    const urlMatch = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/);
    if (!urlMatch) return uri;

    const [, user, pass, host, dbPath = '/campus-lost-found'] = urlMatch;

    // Run system nslookup which uses Windows OS DNS resolver instead of Node's c-ares UDP
    const srvOutput = execSync(`nslookup -type=SRV _mongodb._tcp.${host}`, {
      timeout: 4000,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString();

    const shards = [...srvOutput.matchAll(/svr hostname\s*=\s*([^\s]+)/gi)].map(
      (m) => `${m[1]}:27017`
    );

    if (shards.length > 0) {
      let replicaSet = 'atlas-lr2d1c-shard-0';
      try {
        const txtOutput = execSync(`nslookup -type=TXT ${host}`, {
          timeout: 4000,
          stdio: ['pipe', 'pipe', 'ignore'],
        }).toString();
        const rsMatch = txtOutput.match(/replicaSet=([a-zA-Z0-9_-]+)/);
        if (rsMatch) replicaSet = rsMatch[1];
      } catch {
        // Fall back to default replicaSet name if TXT query unavailable
      }

      const dbName = dbPath && dbPath !== '/' ? dbPath : '/campus-lost-found';
      const resolved = `mongodb://${user}:${pass}@${shards.join(',')}${dbName}?ssl=true&replicaSet=${replicaSet}&authSource=admin&retryWrites=true&w=majority`;
      logger.info('Resolved MongoDB Atlas SRV URI to direct replica set endpoints to bypass Windows DNS querySrv restriction.');
      return resolved;
    }
  } catch {
    // Return original URI if system resolution fails or not in supported shell
  }

  return uri;
};
