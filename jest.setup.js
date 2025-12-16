const crypto = require('crypto');
// Node.js 20+ has global.crypto as read-only and already available
// Only assign for Node versions < 20
const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeVersion < 20) {
    try {
        global.crypto = crypto.webcrypto;
    } catch (e) {
        // Ignore assignment errors
    }
}
// For Node 20+, global.crypto is already available and read-only, so no assignment needed 