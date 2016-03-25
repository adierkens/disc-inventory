
var udisc = {
  applicationID: 'X7O7gSaOUxCv9cTAHSASADcGtaRq7Kf9a4gNA8rn',
  clientID: 'M3Dwdciw8FvvvZoFOsyCkDTZQusGIpXsjX1houlT',
  courseURL: 'https://regasoftwarecom.netfirms.com/scripts/experimental/all_states_json_only.js',
  courses: [],
  courseSelection: []
};

var googleChart = {
  holeData: {},
  options : {
    title: 'Scores for',
    interpolateNulls: false,
    hAxis: {
    },
    histogram: {
      bucketSize: 1,
      minValue: 1,
      maxValue: 10
    },
    chartArea: {
      height: 600,
      width: 600
    }
  },
  dataView: null,
  chart: null,
  data: null
};

const herokuURL = "https://tranquil-ocean-50368.herokuapp.com/";

google.charts.load("current", {packages:["corechart"]});

const stateAbbreviations = {
  Canada: {
    AB: 'Alberta',
    BC: 'British Columbia',
    MB:  'Manitoba',
    NB:  'New Brunswick',
    NF:  'Newfoundland',
    NS:  'Nova Scotia',
    NT:  'Northwest Territories',
    ON:  'Ontario',
    PE:  'Prince Edward Island',
    QC:  'Quebec',
    SK:  'Saskatchewan',
    YT:  'Yukon'
  },
  'United States': {
    AK:  'ALASKA',
    AL:  'ALABAMA',
    AR:  'ARKANSAS',
    AS:  'AMERICAN SAMOA',
    AZ:  'ARIZONA',
    CA:  'CALIFORNIA',
    CO:  'COLORADO',
    CT:  'CONNECTICUT',
    DC:  'WASHINGTON, DISTRICT OF COLUMBIA',
    DE:  'DELAWARE',
    FL:  'FLORIDA',
    FM:  'FEDERATED STATES OF MICRONESIA',
    GA:  'GEORGIA',
    GU:  'GUAM',
    HI:  'HAWAII',
    IA:  'IOWA',
    ID:  'IDAHO',
    IL:  'ILLINOIS',
    IN:  'INDIANA',
    KS:  'KANSAS',
    KY:  'KENTUCKY',
    LA:  'LOUISIANA',
    MA:  'MASSACHUSETTS',
    MD:  'MARYLAND',
    ME:  'MAINE',
    MH:  'MARSHALL ISLANDS',
    MI:  'MICHIGAN',
    MN:  'MINNESOTA',
    MO:  'MISSOURI',
    MP:  'NORTHERN MARIANA ISLANDS',
    MS:  'MISSISSIPPI',
    MT:  'MONTANA',
    NC:  'NORTH CAROLINA',
    ND:  'NORTH DAKOTA',
    NE:  'NEBRASKA',
    NH:  'NEW HAMPSHIRE',
    NJ:  'NEW JERSEY',
    NM:  'NEW MEXICO',
    NV:  'NEVADA',
    NY:  'NEW YORK',
    OH:  'OHIO',
    OK:  'OKLAHOMA',
    OR:  'OREGON',
    PA:  'PENNSYLVANIA',
    PR:  'PUERTO RICO',
    PW:  'PALAU',
    RI:  'RHODE ISLAND',
    SC:  'SOUTH CAROLINA',
    SD:  'SOUTH DAKOTA',
    TN:  'TENNESSEE',
    TX:  'TEXAS',
    UT:  'UTAH',
    VA:  'VIRGINIA',
    VI:  'VIRGIN ISLANDS',
    VT:  'VERMONT',
    WA:  'WASHINGTON',
    WI:  'WISCONSIN',
    WV:  'WEST VIRGINIA',
    WY:  'WYOMING',
  }
};

var dataTable = [];

function showHole(holeNum) {
  googleChart.dataView.showColumns([holeNum]);
  googleChart.chart.draw(googleChart.dataView, googleChart.options);
}

function hideHole(holeNum) {
  googleChart.dataView.hideColumns([holeNum]);
  googleChart.chart.draw(googleChart.dataView, googleChart.options);
}

function loadCourseGraph(responseData) {
  var courseName = $("#udisc-course-course-search option").filter(":selected").text();


  _.each(responseData, function(scorecardEntry) {
    if (scorecardEntry.numberOfHoles !== 18 || scorecardEntry.skipedHoles > 0) {
      return;
    }

    _.each(scorecardEntry.holeScores, function (holeScore) {
      var strokes = holeScore.strokes;
      if (strokes > 0) {
        var bin = strokes;
        if (strokes >= 7) {
          bin = 7;
        }

        if (!googleChart.holeData[holeScore.hole]) {
          googleChart.holeData[holeScore.hole] = {};
        }

        if (!googleChart.holeData[holeScore.hole][bin]) {
          googleChart.holeData[holeScore.hole][bin] = 0;
        }

        googleChart.holeData[holeScore.hole][bin] += 1;
      }
    });
  });


  googleChart.data = new google.visualization.DataTable();
  googleChart.data.addColumn('number', 'Strokes');

  for (var i=0; i<18; i++) {
    googleChart.data.addColumn('number', 'Hole ' + (i + 1));
  }

  for (var strokeCount=1; strokeCount<8; strokeCount++) {
    var row = [];
    row.push(strokeCount);
    for (var holeNum=1; holeNum<=18; holeNum++) {
      row.push(googleChart.holeData[holeNum][strokeCount] || 0);
    }

    googleChart.data.addRow(row);
  }

  var chart = new google.visualization.LineChart(document.getElementById('course_chart'));
  googleChart.options.title = "Scores for " + courseName;
  chart.draw(googleChart.data, googleChart.options);
  googleChart.chart = chart;
}

function loadCourse(courseID) {

  $.ajax({
    url: herokuURL + "scorecardEntry",
    success: function(data, status) {
      loadCourseGraph(data.results);
    },
    error: function(err) {
      console.log(err);
    },
    dataType: 'json',
    method: 'POST',
    data: JSON.stringify({
      courseID: parseInt(courseID, 10)
    }),
    contentType: 'application/json'
  });
}


$(document).ready(function() {

  var couseSelect = $("#udisc-course-course-search");
  var stateSelect = $("#udisc-course-state-search");

  couseSelect.select2({
    placeholder: "Select a course",
    disabled: true
  });

  $.ajax({
    url: 'https://crossorigin.me/' + udisc.courseURL,
    success: function(data, status) {
      udisc.courses = data.courses;

      var coursesByState = {};

      _.each(udisc.courses, function(course) {

        if (course.city) {
          m = /([\w\s]+)[\S\s]*([A-Z]{2})/.exec(course.city);
          if (m === null) {
            return;
          }
          var city = m[1];
          var state = m[2];

          var id = course.id;

          if (typeof id !== "string") {
            id = id.toString();
          }

          if (coursesByState[state] === undefined) {
            coursesByState[state] = [];
          }

          coursesByState[state].push({
            id: id,
            text: course.name,
            city: city
          });

        }
      });


      udisc.courseSelection = coursesByState;

      var selectData = _.map(Object.keys(stateAbbreviations), function(country) {

        var states = [];

        _.each(Object.keys(stateAbbreviations[country]), function(state) {
          states.push({
            id: state,
            text: _.capitalize(stateAbbreviations[country][state])
          });
        });

        return {
          text: country,
          children: states
        };
      });

      selectData = _.sortBy(selectData, function(o) {
        return o.text;
      });

      stateSelect.select2({
        data: selectData,
        placeholder: "Select a state"
      });

      stateSelect.on('change', function() {
        var state = $("#udisc-course-state-search option").filter(":selected").val();

        couseSelect.empty();

        couseSelect.append("<option></option>");

        couseSelect.select2({
          disabled: false,
          data: udisc.courseSelection[state],
          placeholder: "Select a course"
        });

        couseSelect.select2('data', udisc.courseSelection[state], true);

      });
    },
    dataType: 'json'
  });

  couseSelect.on('change', function() {
    var courseId = $("#udisc-course-course-search option").filter(":selected").val();

    console.log('Course id ' + courseId);
    loadCourse(courseId);
  });

});


