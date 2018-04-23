/**
 * Convert service account credentials JSON to command line, allowing to
 * update the environment.
 *
 * How to call it:
 *
 * node scripts/conver.js <path to credentials file>.json | bash
 *
 * After that, make a deploy with `npm run deploy`
 */

const args = [].slice.call(process.argv);

const serviceAccount = require(args[args.length - 1]);

const pairs = Object.keys(serviceAccount)
  .map(key => {
    const value = serviceAccount[key];
    return `credentials.${key}="${value}"`;
  })
  .join(" ");

console.log(`firebase functions:config:set ${pairs}`);
