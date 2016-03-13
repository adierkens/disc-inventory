/**
 * Created by Adam on 3/12/16.
 */
var inventory = [];
var discDB = [];
var headers = [
  'type',
  'manufacturer',
  'mold',
  'plastic',
  'color',
  'weight',
  'speed',
  'glide',
  'turn',
  'fade',
  'where'
];

function parseCells(data, firstColumn) {
  var rows = [];
  var cells = data.feed.entry;
  for (var i = 0; i < cells.length; i++){
    var rowObj = {};
    rowObj[firstColumn] = cells[i].title.$t;
    var rowCols = cells[i].content.$t.split(',');
    for (var j = 0; j < rowCols.length; j++){
      var keyVal = rowCols[j].split(':');
      if (keyVal.length !== 2) {
        continue;
      }
      var val = keyVal[1].trim();
      var key = keyVal[0].trim();
      if (key === 'weight') {
        val = parseInt(val, 10);
      }
      rowObj[key] = val;
    }
    rows.push(rowObj);
  }
  return rows;
}

var inventoryCallback = function(data) {
  inventory = parseCells(data, 'manufacturer');
  drawGraph();
};

var manufacturerCallback = function(data) {
  var rows = parseCells(data, 'type');
  var parsedRows = [];
  _.each(rows, function(row) {
    var plastics = [];
    if (row.plastics) {
      _.each(row.plastics.split(','), function (plastic) {
        plastics.push(plastic.trim());
      });
      row.plastics = plastics;
    } else {
      row.plastics = [];
    }
    parsedRows.push(row);
  });

  discDB = discDB.concat(parsedRows);
  drawGraph();
};

function getStatsForDisc(disc) {
  var stats = {
    speed: '-',
    turn: '-',
    glide: '-',
    fade: '-'
  };

  var matches = _.filter(discDB, {
    manufacturer: disc.manufacturer,
    mold: disc.mold
  });

  if (matches.length > 0) {
    return matches[0]
  } else {
    return stats;
  }
}

function drawGraph() {

  function getDataSet() {
    var rows = [];

    _.each(inventory, function(row) {
      var newRow = [];

      var stats = getStatsForDisc(row);

      _.each(headers, function(header) {
        if (row[header]) {
          newRow.push(row[header]);
        } else if (stats[header]) {
          newRow.push(stats[header]);
        } else {
          newRow.push('');
        }
      });
      rows.push(newRow);
    });
    return rows;
  }

  $('#inventory-table').DataTable({
    data: getDataSet(),
    columns: _.map(headers, function (header) {
      return {
        title: _.upperFirst(header)
      }
    }),
    pageLength: 25
  });
}

$(document).ready(function() {
  drawGraph();
});