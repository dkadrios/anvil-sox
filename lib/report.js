(function () {
  'use strict';

  var _ = require('lodash'),
      gutil = require('gulp-util'),

      layerHistogram = [];

  function cyan() {
    gutil.log(gutil.colors.cyan.apply(this, arguments));
  }

  function red() {
    gutil.log(gutil.colors.red.apply(this, arguments));
  }

  function hasMissingLayers(arr) {
    var i;

    for (i = 1;i <= arr.length;i++) {
      if (i !== arr[i - 1].idx) {
        return true;
      }
    }
    return false;
  }

  module.exports.reportLayers = function () {
    var key,
        item,
        i, j,
        s,
        MAX_SLOTS = 33,
        items = module.exports.uniques.items;

    // Clear histogram
    for (i = 0;i < MAX_SLOTS;i++) {
      layerHistogram.push(0);
    }

    for (key in items) {
      if (items.hasOwnProperty(key)) {
        item = items[key];
        layerHistogram[item.layers.length]++;
      }
    }

    for (i = 0;i < MAX_SLOTS;i++) {
      s = i + ' ';
      for (j = 0;j < layerHistogram[i];j++) {
        s += '|';
      }
      cyan(s);
    }
  };

  module.exports.uniques = {};

  module.exports.reportUniques = function () {
    var key,
        item,
        items = module.exports.uniques.items;

    for (key in items) {
      if (items.hasOwnProperty(key)) {
        item = items[key];

        item.layers = _.sortBy(item.layers, 'idx', function (num) {
          return num;
        });

        if (hasMissingLayers(item.layers)) {
          red([item.name, 'is missing layer(s)', _.map(item.layers, 'idx')]);
        }

        cyan([
          item.name,
          _.map(item.layers, 'idx')
        ]);
      }
    }
  };
})();
