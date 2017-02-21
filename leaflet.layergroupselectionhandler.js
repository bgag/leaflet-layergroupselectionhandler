/* global L:true */

'use strict'

var LayerGroupClickHandler = null

if (typeof module !== 'undefined' && module.exports) {
  LayerGroupClickHandler = require('leaflet-layergroupclickhandler')
} else {
  LayerGroupClickHandler = L.LayerGroupClickHandler
}

/**
 * Multiselection handler for LayerGroups
 * @param group
 * @param options
 * @constructor
 */
var LayerGroupSelectionHandler = function (group, options) {
  var self = this
  var clickHandler = new LayerGroupClickHandler(group)
  var selections = []

  options = options || {}
  options.color = options.color || '#ff8080'

  var findByBounds = function (needle, layers) {
    var bounds = needle.getBounds()

    layers = layers || self.getSelections()

    return layers.reduce(function (found, layer, index) {
      // if not found, chech bounds
      if (found === -1 && bounds.equals(layer.getBounds())) {
        return index
      }

      return found
    }, -1)
  }

  var isSelected = function (layer) {
    return findByBounds(layer) !== -1
  }

  var buildLayerBackup = function (layer, previous) {
    // if there is an previous selection use that backup info
    var previousColor = previous && previous.backup.color

    // backup original color if available
    var layerColor = layer.options && layer.options.color

    return {
      layer: layer,
      color: previousColor || layerColor
    }
  }

  var buildBackup = function (layer, previous) {
    // if it's a group layer process all sub layers
    if (typeof layer.eachLayer !== 'undefined') {
      var backup = []

      layer.eachLayer(function (subLayer) {
        backup.push(buildLayerBackup(subLayer))
      })

      return backup
    } else {
      return [buildLayerBackup(layer, previous)]
    }
  }

  var select = function (layer, previous) {
    var index = findByBounds(layer)

    var data = {
      layer: layer,
      backup: buildBackup(layer, previous)
    }

    // update existing data or add new data
    if (index !== -1) {
      selections[index] = data
    } else {
      selections.push(data)
    }

    layer.setStyle({color: options.color})
  }

  var deselect = function (layer) {
    var index = findByBounds(layer)
    var data = selections[index]

    // restore color of all layers
    data.backup.forEach(function (backup) {
      backup.layer.setStyle({
        color: backup.color
      })
    })

    selections.splice(index, 1)
  }

  var handler = function (event) {
    var layer = event.layer || event.target

    if (!isSelected(layer)) {
      select(layer)

      if (options.onSelect) {
        options.onSelect(layer)
      }
    } else {
      deselect(layer)

      if (options.onDeselect) {
        options.onDeselect(layer)
      }
    }

    if (options.onChange) {
      options.onChange(self.getSelections())
    }
  }

  this.enabled = function () {
    return clickHandler.enabled()
  }

  this.enable = function () {
    clickHandler.enable(handler)
  }

  this.disable = function () {
    clickHandler.disable()
  }

  this.update = function (layers) {
    clickHandler.update()

    // support group layers and arrays
    var loop = (layers.eachLayer && layers.eachLayer.bind(layers)) || (layers.forEach && layers.forEach.bind(layers))

    loop(function (layer) {
      var index = findByBounds(layer)

      if (index !== -1) {
        select(layer, selections[index])
      }
    })
  }

  this.getSelections = function () {
    return selections.map(function (selection) {
      return selection.layer
    })
  }

  this.deselect = function (layer) {
    // if no layer is given, deselect all
    if (!layer) {
      selections.slice(0).forEach(function (selection) {
        deselect(selection.layer)
      })
    } else {
      deselect(layer)
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LayerGroupSelectionHandler
} else {
  L.LayerGroupSelectionHandler = LayerGroupSelectionHandler
}
