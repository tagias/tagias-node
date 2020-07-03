'use strict';
const { Tagias, TagiasTypes, TagiasStatuses, TagiasError } = require('./index');

/**
 * Testing the TAGIAS external API methods
 *
 * @returns {Promise<void>} - array of packages
 */
async function test() {
  try {
    if (!process.env.npm_config_apikey) {
      console.log('You have to specify your API Key in the apikey argument like:\nnpm test --apikey=\'whLUN5vkMFuaR8RuSN3Xg%qLlGfWvfDz\'');
      return;
    }

    console.log('Test Start');
    let isRequested = false;

    // create tagias helper object
    const tagias = new Tagias(process.env.npm_config_apikey);

    // get the list of all your packages
    const packages = await tagias.getPackages();
    /* eslint-disable no-await-in-loop */
    for (const pack of packages) {
      console.log(`${pack.name}, ${pack.type}, ${pack.status}, ${pack.created}`);
      // get the package's results if it's already finished (one package only)
      if (pack.status === TagiasStatuses.FINISHED && !isRequested) {
        isRequested = true;
        const res = await tagias.getResult(pack.id);
        console.log(`${pack.id} results: ${JSON.stringify(res)}`);

        try {
          // request the package's results to be send to the callback endpoint
          await tagias.requestResult(pack.id);
          console.log(`${pack.id} results were requested`);
        } catch (e) {
          console.log(`${pack.id} results were NOT requested: ${e.message}`);
        }
      }
    }

    // create a new package
    const newPackage = await tagias.createPackage('Test package', TagiasTypes.Keypoints, 
      'Put one point only in the center of the image', null, null,
      'https://p.tagias.com/samples/', ['dog.8001.jpg', 'dog.8002.jpg', 'dog.8003.jpg']);
    console.log(`Package ${newPackage.id} was created with ${newPackage.pictures_num} image(s)`);

    // modify the package's status
    await tagias.setPackageStatus(newPackage.id, 'STOPPED');

    // get the package's properties
    const pack = await tagias.getPackage(newPackage.id);
    console.log(`Package: ${JSON.stringify(pack)}`);

    // get current balance and financial operations
    const balance = await tagias.getBalance();
    console.log(`Balance: ${JSON.stringify(balance)}`);

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
