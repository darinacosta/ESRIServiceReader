var jsonURL = "http://gis.nola.gov:6080/arcgis/rest/services/Staging/Historic/MapServer/2?f=pjson";
  var layer = jsonURL.split(/\?/)[0];
  var restService = layer.split(/\/*\d$/)[0];
  var layerID = layer.split(/\/*\d/)[1];

  //Tab display control
  $('#myTab a').click(function (e) {
  e.preventDefault();
  $(this).tab('show');
})
  
  //Populate Metadata
  $.getJSON(jsonURL, function( data ) {
    $('#layer-name').text(data.name);
    $('#service-title').text(data.name);
    $('#description').text(data.description);
  });

  $('#service').html("<a href='" + restService + "' target='_blank'>" + restService + "</a>")

  //Map Control
  function loadMap(){
    var map;
    require(["esri/map", 
      "esri/layers/ArcGISDynamicMapServiceLayer", 
      "esri/layers/ArcGISTiledMapServiceLayer",
      "dojo/domReady!"], 

    function(Map,
      ArcGISDynamicMapServiceLayer,
      ArcGISTiledMapServiceLayer) {
      
    var service = new ArcGISDynamicMapServiceLayer(restService);
    service.setVisibleLayers([0]);
    var basemap = new ArcGISTiledMapServiceLayer("http://gis.nola.gov:6080/arcgis/rest/services/Basemaps/BasemapNOLA3/MapServer");
  
    map = new Map("nola-map", {
      center: [-90.030, 29.98], // longitude, latitude
      zoom: 12,
      logo: false
    });
      map.addLayer(basemap);
      map.addLayer(service);
  });
  };
