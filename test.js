'use strict';
// reference the tagias api helper classes
const { Tagias, TagiasTypes, TagiasStatuses, TagiasError } = require('./index');

/**
 * Testing the TAGIAS external API methods
 *
 * @returns {Promise<void>} - nothing
 */
async function test() {
  try {
    if (!process.env.npm_config_apikey) {
      console.log('You have to specify your API Key in the apikey argument like:');
      console.log('npm test --apikey=\'whLUN5vkMFuaR8RuSN3Xg%qLlGfWvfDz\'');
      console.log(' or use the "test" key for quick read-only environment testing:');
      console.log('npm test --apikey=\'test\'');
      return;
    }

    console.log('Test Start');
    let isRequested = false;

    if (process.env.npm_config_apikey === 'test') {
      console.log('Using the "test" API key for read-only test environment, some calls might fail');
    }

    // create tagias helper object
    const tagias = new Tagias(process.env.npm_config_apikey);

    // create a new package
    const newPackage = await tagias.createPackage('Test package', TagiasTypes.Keypoints,
      'Put one point only in the center of the image', null, null,
      'https://p.tagias.com/samples/', ['dog.8001.jpg', 'dog.8002.jpg', 'dog.8003.jpg']);
    console.log(`Package ${newPackage.id} was created with ${newPackage.pictures_num} image(s)`);

    try {
      // modify the package's status
      await tagias.setPackageStatus(newPackage.id, 'STOPPED');
    } catch (e) {
      console.log(`${newPackage.id} package's status was NOT modified: ${e.message}`);
    }

    // get the package's properties
    const pack = await tagias.getPackage(newPackage.id);
    console.log(`New package properties:`);
    for (var prop in pack) {
      console.log(`* ${prop}: ${pack[prop]}`);
    }
    // get the list of all your packages
    const packages = await tagias.getPackages();
    console.log('Packages:');
    /* eslint-disable no-await-in-loop */
    for (const pack of packages) {
      console.log(` * ${pack.name}, ${pack.type}, ${pack.status}, ${pack.created}`);
      // get the package's result if it's already finished (one package only)
      if (pack.status === TagiasStatuses.FINISHED && !isRequested) {
        isRequested = true;
        const res = await tagias.getResult(pack.id);
        console.log(`${res.id} package's result contains ${res.pictures.length} image(s), finished at ${res.finished}`);

        try {
          // request the package's result to be send to the callback endpoint
          await tagias.requestResult(pack.id);
          console.log(`${pack.id} package's result was requested`);
        } catch (e) {
          console.log(`${pack.id} package's result was NOT requested: ${e.message}`);
        }
      }
    }

    // get current balance and financial operations
    const balance = await tagias.getBalance();
    console.log(`Current balance: ${balance.balance} USD`);
    console.log('Operations:');
    for (const op of balance.operations) {
      console.log(` * ${op.date}: ${op.amount} USD, ${op.note}`);
    }

    console.log('Test End');
  } catch (e) {
    if (e instanceof TagiasError) {
      // handle a TagiasError exception
      console.log(`${e.name}: ${e.message} (${e.code})`);
    } else {
      // all other (e.g. axios) exceptions
      console.log(e);
    }
  }
}

(async () => await test())();
