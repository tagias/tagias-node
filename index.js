'use strict';
const axios = require('axios');

/**
 * Enum for project types
 *
 * @readonly
 * @enum {string}
 */
const TagiasTypes = {
  BoundingBoxes: 'BoundingBoxes',
  Polygons: 'Polygons',
  Keypoints: 'Keypoints',
  ClassificationSingle: 'ClassificationSingle',
  ClassificationMultiple: 'ClassificationMultiple',
  Lines: 'Lines'
};

/**
 * Enum for project statuses
 *
 * @readonly
 * @enum {string}
 */
const TagiasStatuses = {
  ACTIVE: 'ACTIVE',
  STOPPED: 'STOPPED',
  SUSPENDED: 'SUSPENDED',
  FINISHED: 'FINISHED'
};

/**
 * Enum for TAGIAS error codes
 *
 * @readonly
 * @enum {string}
 */
const TagiasErrors = {
  NONAME: 'NONAME',
  NOPICTURES: 'NOPICTURES',
  BADPICTURES: 'BADPICTURES',
  NOLABELS: 'NOLABELS',
  BADCALLBACK: 'BADCALLBACK',
  BADBASEURL: 'BADBASEURL',
  BADTYPE: 'BADTYPE',
  BADSTATUS: 'BADSTATUS',
  NOTFOUND: 'NOTFOUND',
  INTERNAL: 'INTERNAL',
  NOAPIKEY: 'NOAPIKEY',
  UNAUTHORIZED: 'UNAUTHORIZED'
};

/**
 * URL for the TAGIAS external API endpoint
 *
 * @constant {string}
 * @default
 */
const TAGIAS_URL = 'https://p.tagias.com/api/v2/tagias';

/**
 * Translates the provided TAGIAS error code to a string message
 *
 * @param {string} code - error code
 * @returns {string} - error message
 */
function translateErrorCode(code) {
  switch (code) {
    case TagiasErrors.NONAME: return 'The package name is missing';
    case TagiasErrors.NOPICTURES: return 'The pictures array is empty or missing';
    case TagiasErrors.BADPICTURES: return 'Some of the provided pictures could not be accessed or their URLs are malformed';
    case TagiasErrors.NOLABELS: return 'The labels array for the classification task is missing (or there are less than 2 items in the array)';
    case TagiasErrors.BADCALLBACK: return 'The callback URL is malformed';
    case TagiasErrors.BADBASEURL: return 'The baseurl URL is malformed';
    case TagiasErrors.BADTYPE: return 'The type value is not one of the allowed values';
    case TagiasErrors.BADSTATUS: return 'The status value is not one of the allowed values or this kind of change is not allowed';
    case TagiasErrors.NOTFOUND: return 'The specified object does not exist';
    case TagiasErrors.INTERNAL: return 'An internal error has occurred';
    case TagiasErrors.NOAPIKEY: return 'TAGIAS API Key is not provided';
    case TagiasErrors.UNAUTHORIZED: return 'TAGIAS API Key is incorrect';
    default: return 'Unknown error code';
  }
}

/**
 * Executes the supplied function and handles known exceptions
 *
 * @async
 * @param {Function} func - an async function to execute
 * @returns {object} - result data
 * @throws {TagiasError}
 */
async function apiCall(func) {
  let result;

  try {
    result = await func();
  } catch (e) {
    if (e.isAxiosError === true && e.response && e.response.status === 401) {
      throw new TagiasError(TagiasErrors.UNAUTHORIZED);
    }

    throw e;
  }

  if (result.data.status !== 'ok') throw new TagiasError(result.data.error);

  return result.data;
}

/**
 * TAGIAS error class that contains a code and a message for the thrown error
 */
class TagiasError extends Error {
  /**
   * Constructor for the TAGIAS error
   *
   * @param {string} code - error code
   */
  constructor(code) {
    super(translateErrorCode(code));
    this.code = code;
    this.name = 'TagiasError';
  }
}

/**
 * TAGIAS helper class
 *
 * @property {string} apiKey - TAGIAS API key
 * @property {axios.AxiosInstance} instance - axios instance object
 */
class Tagias {
  /**
   * Saves the provided API key for using it in subsequent method calls
   *
   * @param {string} apiKey - TAGIAS API key
   * @throws {TagiasError}
   */
  constructor(apiKey) {
    if (!apiKey) throw new TagiasError(TagiasErrors.NOAPIKEY);

    this.apiKey = apiKey;

    this.instance = axios.create({
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Api-Key ${this.apiKey}`
      }
    });
  }

  /**
   * @typedef {object} TagiasPackage
   * @property {string} id - package unique identifier
   * @property {string} name - package name
   * @property {string} type - package type
   * @property {string} status - package status
   * @property {Date} created - a UTC date and time value when the package was created
   * @property {number} amount - the amount (in USD) spent for annotating images from this package
   * @property {number} pictures_num - the number of images stored within the package
   * @property {number} completed_num - the number of images that got their annotations
   */

  /**
   * Returns the array of created packages
   *
   * @async
   * @returns {Promise<Array<TagiasPackage>>} - array of packages
   * @throws {TagiasError}
   */
  async getPackages() {
    const result = await apiCall(async () => this.instance.get(`${TAGIAS_URL}/packages`));

    result.packages.map((item, index) => { if (item.created) result.packages[index].created = new Date(item.created); });

    return result.packages;
  }

  /**
   * @typedef {object} TagiasNewPackage
   * @property {string} id - package unique identifier
   * @property {number} pictures_num - the number of images stored within the package
   */

  /**
   * Creates a new TAGIAS package for annotation
   *
   * @async
   * @param {string} name - package name
   * @param {TagiasTypes} type - package type
   * @param {string} descr - package description
   * @param {Array<string>} labels - array of labels for the classification packages
   * @param {string} callback - callback url where the results should be posted
   * @param {string} baseurl - base url address that will be appended at the start of every picture url
   * @param {Array<string>} pictures - array of pictures' url
   * @param {boolean} labels_required - if annotations must be marked with a label from the labels array
   * @returns {Promise<TagiasNewPackage>} - an object with the newly created package information
   * @throws {TagiasError}
   */
  async createPackage(name, type, descr, labels, callback, baseurl, pictures, labels_required = null) {
    const data = {
      name,
      type,
      descr,
      labels,
      callback,
      baseurl,
      pictures,
      labels_required
    };

    const result = await apiCall(async () => this.instance.post(`${TAGIAS_URL}/packages`, data));

    const res = {
      id: result.id,
      pictures_num: result.pictures_num
    };

    return res;
  }

  /**
   * Modifies the TAGIAS package's status
   *
   * @async
   * @param {string} id - package unique identifier
   * @param {string} status - new package status (ACTIVE, STOPPED, DELETED)
   * @returns {Promise<void>} - nothing
   * @throws {TagiasError}
   */
  async setPackageStatus(id, status) {
    const data = {
      status
    };

    await apiCall(async () => this.instance.patch(`${TAGIAS_URL}/packages/${id}`, data));
  }

  /**
   * @typedef {object} TagiasFullPackage
   * @property {string} id - package unique identifier
   * @property {string} name - package name
   * @property {string} type - package type
   * @property {string} status - package status
   * @property {string} descr - annotation task detailed description
   * @property {Array<string>} labels - array of labels for the classification annotation
   * @property {boolean} labels_required - if annotations must be marked with a label from the labels array
   * @property {string} callback - the callback endpoint URL
   * @property {Date} created - a UTC date and time value when the package was created
   * @property {Date} started - a UTC date and time value when the first annotation was saved
   * @property {Date} stopped - a UTC date and time value of the last moment when the package was stopped
   * @property {Date} finished - a UTC date and time value when all images from the package were completed
   * @property {Date} updated - a UTC date and time value when the last annotation was saved
   * @property {Date} delivered - a UTC date and time value of the last moment when the results were sent to the callback endpoint
   * @property {string} baseurl - a starting part of every image URL
   * @property {number} amount - the amount (in USD) spent for annotating images from this package
   * @property {number} pictures_num - the number of images stored within the package
   * @property {number} completed_num - the number of images that got their annotations
   */

  /**
   * Reads the TAGIAS package's properties
   *
   * @async
   * @param {string} id - package unique identifier
   * @returns {Promise<TagiasFullPackage>} - a package object with its properties
   * @throws {TagiasError}
   */
  async getPackage(id) {
    const result = await apiCall(async () => this.instance.get(`${TAGIAS_URL}/packages/${id}`));

    if (result.package.created) result.package.created = new Date(result.package.created);
    if (result.package.started) result.package.started = new Date(result.package.started);
    if (result.package.stopped) result.package.stopped = new Date(result.package.stopped);
    if (result.package.finished) result.package.finished = new Date(result.package.finished);
    if (result.package.updated) result.package.updated = new Date(result.package.updated);
    if (result.package.delivered) result.package.delivered = new Date(result.package.delivered);

    return result.package;
  }

  /**
   * Requests the tagias.com server to send currently available annotations for all completed images from the specified package to the package's callback endpoint
   *
   * @async
   * @param {string} id - package unique identifier
   * @returns {Promise<void>} - nothing
   * @throws {TagiasError}
   */
  async requestResult(id) {
    await apiCall(async () => this.instance.post(`${TAGIAS_URL}/packages/result/${id}`));
  }

  /**
   * @typedef {object} TagiasAnnotation
   * @property {string} name - image name or full URL
   * @property {object} result - an object containing annotation information
   */

  /**
   * @typedef {object} TagiasResult
   * @property {string} id - package unique identifier
   * @property {Date} finished - a UTC date and time value when all images from the package were completed
   * @property {string} baseurl - a starting part of every image URL
   * @property {Array<TagiasAnnotation>} pictures - array of annotations for every completed image
   */

  /**
   * Reads the currently available annotations for all completed images from the specified package
   *
   * @async
   * @param {string} id - package unique identifier
   * @returns {Promise<TagiasResult>} - an object containing annotation results
   * @throws {TagiasError}
   */
  async getResult(id) {
    const result = await apiCall(async () => this.instance.get(`${TAGIAS_URL}/packages/result/${id}`));

    if (result.finished) result.finished = new Date(result.finished);
    delete result.status;

    return result;
  }

  /**
   * @typedef {object} TagiasOperation
   * @property {Date} date - a UTC date and time value when the operation was recorded
   * @property {number} amount - the amount (in USD) that has lead to balance increase or decrease
   * @property {string} note - a comment note explaining the operation (or package name and unique identifier)
   */

  /**
   * @typedef {object} TagiasBalance
   * @property {number} balance - current balance amount (in USD)
   * @property {Array<TagiasOperation>} operations - an array operations that have changed the balance amount
   */

  /**
   * Reads the current balance amount and the list of all operations
   *
   * @async
   * @returns {Promise<TagiasBalance>} - an object containing the balance amount and the operations array
   * @throws {TagiasError}
   */
  async getBalance() {
    const result = await apiCall(async () => this.instance.get(`${TAGIAS_URL}/balance`));

    result.operations.map((item, index) => { if (item.date) result.operations[index].date = new Date(item.date); });
    delete result.status;

    return result;
  }
}

module.exports = {
  Tagias,
  TagiasTypes,
  TagiasStatuses,
  TagiasErrors,
  TagiasError
};
