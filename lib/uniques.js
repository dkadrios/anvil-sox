(function () {
  'use strict';

  var fs = require('fs'),
      gutil = require('gulp-util'),
      trs = require('./trs').use('Zendrum Box.txt'),

      reFilename = /^(.+)([^\d])(\d*)\.wav$/,
      MAX_LAYERS = 16;

  function red() {
    gutil.log(gutil.colors.red.apply(this, arguments));
  }

  function formatFilename(filename) {
    var result = filename.replace(/[- ]/g, '_');

    result = result.replace('__', '_');

    while (result && result.length && result[result.length - 1] === '_') {
      result = result.substr(0, result.length - 1);
    }
    return result;
  }

  module.exports.items = {};

  /**
   * Extracts the unique portion and layer number of a given filename.
   *
   * @param {String} filename - wav file
   * @returns {Object} parsed file
   */
  module.exports.parseFilename = function (filename) {
    /** @type {Array} */
    var result = filename.match(reFilename),
        /** @type {String} */
        uniqueName,
        /** @type {Number} */
        layer;

    if (result && result.length === 4) {
      uniqueName = result[1] + result[2];
      layer = parseInt(result[3], 10);

    } else if (result && result.length === 3) {
      uniqueName = result[1] + result[2];
      layer = 0;

    } else {
      red(['Invalid filename', filename, result]);
      process.exit(1);
    }

    uniqueName = formatFilename(uniqueName);

    if (!module.exports.items.hasOwnProperty(uniqueName)) {
      module.exports.items[uniqueName] = {
        name: uniqueName,
        layers: []
      };
    }
    module.exports.items[uniqueName].layers.push({
      idx: layer,
      originalFilename: filename
    });

    return module.exports.items[uniqueName];
  };

  function zeroPad(val) {
    var result = String(val);

    while (result.length < 4) {
      result = '0' + result;
    }
    return result;
  }

  function outputEntry(item, trsEntry, folderIn, folderOut) {
    var _ = require('lodash'),
        interval = item.layers.length / MAX_LAYERS,
        i,
        idx,
        layer,
        filename,
        noteNum;

    item.expanded = [];

    item.layers = _.sortBy(item.layers, ['idx']);

    for (i = 0;i < MAX_LAYERS;i++) {
      idx = Math.ceil((i + 1) * interval);
      layer = item.layers[idx];

      while (!layer) {
        layer = item.layers[--idx];
      }

      noteNum = (i << 7) | trsEntry.noteNum; //eslint-disable-line

      filename = zeroPad(noteNum) + '_' + item.name + '.wav';

      item.expanded.push(filename);

      fs.createReadStream(folderIn + layer.originalFilename)
          .pipe(fs.createWriteStream(folderOut + filename));
    }
  }

  module.exports.pairWithTRS = function (folderIn, folderOut) {
    var items = module.exports.items,
        item,
        key,
        trsEntry;

    if (folderOut) {
      fs.mkdirSync(folderOut);
    }

    //console.log(trs.entries);
    for (key in items) {
      if (items.hasOwnProperty(key)) {
        item = items[key];

        //console.log(item)
        trsEntry = trs.find(item);
        if (!trsEntry) {
          red('Could not find TRS entry for', item.name);
        } else {
          //cyan('Found!', item.name);
          // console.log(trsEntry.name, item.layers.length)
          if (folderOut) {
            outputEntry(item, trsEntry, folderIn, folderOut);
          }
        }
      }
    }
  };
})();
