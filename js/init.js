  //JQuery No Conflict
  (function ($) {
   $(document);
  }(jQuery));

  //Portal URL
  var portalURL = "http://portal.nolagis.opendata.arcgis.com/datasets/03da2b89cb90479a8ef11567c63146c1_1"
  var portalJsonUrl = portalURL + ".json"

  //Initialize Data Variables
  var portalJson;
  var layerJsonURL;
  var layer;
  var restServiceArray;
  var restService;
  var layerID;
  var shapefile;

  //Handle Data 
  $.getJSON(portalJsonUrl, function(json){

    //Define Data
    portalJson = json;
    layer = portalJson.data.url;
    layerJsonURL = layer + "?f=pjson";
    layerAttributesJsonURL = layer + "/query?where=1%3D1&outFields=*&callback=?&f=pjson"
    restServiceArray = layer.split(/\/*(?=\d$)/);
    restService = restServiceArray[0];
    layerID = restServiceArray[1];
    shapefile = portalJsonUrl.split('.json')[0] + '.zip'

    //Populate Metadata
    $('#layer-name').text(portalJson.data.name);
    $('#service-title').text(portalJson.data.name);
    $('#description').text(portalJson.data.description);
    $('#shape-download').text(shapefile);
    $('#service').html("<a href='" + restService + "' target='_blank'>" + restService + "</a>")
  });

  //Tab display control
  $('#myTab a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  })

  //Activate the following once the map tab is clicked. 
  function loadMap(){

    //Begin Map Control
    require(["esri/map", 
      "application/bootstrapmap",
      "esri/layers/ArcGISDynamicMapServiceLayer", 
      "esri/layers/ArcGISTiledMapServiceLayer",
      "esri/layers/FeatureLayer",
      "esri/tasks/query",
      "esri/tasks/QueryTask",
      "dojo/domReady!"], 

    function(Map,
      BootstrapMap,
      ArcGISDynamicMapServiceLayer,
      ArcGISTiledMapServiceLayer,
      Query,
      QueryTask) {
      
    var service = new ArcGISDynamicMapServiceLayer(restService);
    service.setVisibleLayers([layerID]);
    
    var basemap = new ArcGISTiledMapServiceLayer("http://gis.nola.gov:6080/arcgis/rest/services/Basemaps/BasemapNOLA3/MapServer");
  
    var map = BootstrapMap.create("nola-map", {
      center: [-90.030, 29.98], // longitude, latitude
      zoom: 12,
      logo: false
    });
      map.addLayer(basemap);
      map.addLayer(service);


    //Query Test
    var queryTask = new QueryTask(layer);
    var query = new Query();
    query.where = "1=1";
    query.outFields = ["*"];
    queryTask.execute(query, logQuery, function(error){
      console.log(error);
    });
    
    function logQuery(query){  
      console.log('tested');
    }
    
      
    $.getJSON(layerAttributesJsonURL, function(json){console.log(json)});  

    });

  };
