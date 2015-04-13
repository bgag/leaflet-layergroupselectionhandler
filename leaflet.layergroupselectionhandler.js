/* global L:true */

'use strict';


/**
 * Multiselection handler for LayerGroups
 * @param group
 * @param options
 * @constructor
 */
L.LayerGroupSelectionHandler = function (group, options) {
  var
    self = this,
    clickHandler = new L.LayerGroupClickHandler(group),
    selections = [];

  if (options == null) {
    options = {};
  }

  if (!('color' in options)) {
    options.color = '#ff8080';
  }

  var findByBounds = function (layers, bounds) {
    return layers.reduce(function (found, layer, index) {
      // already found
      if (found !== null) {
        return found;
      }

      // compare bounds
      if (bounds.equals(layer.getBounds())) {
        return index;
      } else {
        return null;
      }
    }, null);
  };

  var selection = function (layer, value) {
    var index = findByBounds(self.getSelections(), layer.getBounds());

    if (index !== null) {
      if (value === null) {
        var toDeleted = selections[index];

        selections.splice(index, 1);

        return toDeleted;
      } else {
        if (value !== undefined) {
          selections[index] = value;
        }

        return selections[index];
      }
    } else {
      if (value !== undefined) {
        selections.push(value);

        return value;
      } else {
        return null;
      }
    }
  };

  var select = function (layer, outdated) {
    var backup = null;

    // backup original color if available
    if ('options' in layer && 'color' in layer.options) {
      backup = { color: layer.options.color };
    }

    // if there is an outdated selection use that backup info
    if (outdated != null) {
      backup = { color: outdated.backup.color };
    }

    selection(layer, { backup: backup, layer: layer });

    layer.setStyle({color: options.color});
  };

  var deselect = function (layer) {
    if (layer != null) {
      var toDelete = selection(layer, null);

      toDelete.layer.setStyle({color: toDelete.backup.color});
    } else {
      selections.slice(0).forEach(function (selection) { deselect(selection.layer); });
    }
  };

  var handler = function (event) {
    var
      layer = event.layer || event.target,
      existing = selection(layer);

    if (existing == null) {
      select(layer);

      if ('onSelect' in options) {
        options.onSelect(layer);
      }
    } else {
      deselect(layer);

      if ('onDeselect' in options) {
        options.onDeselect(layer);
      }
    }

    if ('onChange' in options) {
      options.onChange(self.getSelections());
    }
  };

  this.enabled = function () {
    return clickHandler.enabled();
  };

  this.enable = function () {
    clickHandler.enable(handler);
  };

  this.disable = function () {
    clickHandler.disable();
  };

  this.update = function (layers) {
    clickHandler.update();

    layers.forEach(function (layer) {
      var outdated = selection(layer);

      if (outdated != null) {
        select(layer, outdated);
      }
    });
  };

  this.getSelections = function () {
    return selections.map(function (selection) { return selection.layer; });
  };

  this.deselect = function (layer) {
    deselect(layer);
  };
};
