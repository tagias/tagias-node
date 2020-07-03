# tagias-node
Public npm helper module for tagias.com external API

## Installation

`npm install tagias-node --save`

## Documentation
You can find the detailed documentation for our external REST API at the [API Reference](https://tagias.com/docs) page

## Usage

This helper module was designed to simplify the way you are using the tagias.com external API

```js
const { Tagias, TagiasTypes, TagiasStatuses, TagiasError } = require('tagias-node');

async function test() {
  try {
    const apikey = "...."; // you API Key from the tagias.com site

    // create tagias helper object
    const tagias = new Tagias(apikey);

    // get the list of all your packages
    const packages = await tagias.getPackages();
    for (const pack of packages) {
      console.log(`${pack.name}, ${pack.type}, ${pack.status}, ${pack.created}`);
      // get the package's results if it's already finished
      if (pack.status === TagiasStatuses.FINISHED) {
        const res = await tagias.getResult(pack.id);
        console.log(`${pack.id} results: ${JSON.stringify(res)}`);
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
```
